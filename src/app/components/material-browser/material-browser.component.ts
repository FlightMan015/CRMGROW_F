import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { STATUS } from 'src/app/constants/variable.constants';
import { Material } from 'src/app/models/material.model';
import { MaterialService } from 'src/app/services/material.service';
import { StoreService } from 'src/app/services/store.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import * as _ from 'lodash';
import { searchReg } from 'src/app/helper';

@Component({
  selector: 'app-material-browser',
  templateUrl: './material-browser.component.html',
  styleUrls: ['./material-browser.component.scss']
})
export class MaterialBrowserComponent implements OnInit, OnDestroy {
  DISPLAY_COLUMNS = ['select', 'material_name', 'creator', 'share', 'type'];
  STATUS = STATUS;
  siteUrl = environment.website;
  user_id = '';

  material_type = '';
  materials: any[] = [];
  filteredMaterials: any[] = [];
  selection: any[] = [];

  loadSubscription: Subscription;
  profileSubscription: Subscription;

  folders: Material[] = [];
  foldersKeyValue = {};

  selectedFolder: Material;
  searchStr = '';
  matType = '';

  multiple = true;
  onlyMine = false;
  resultMatType = 'material';
  selectedSort = 'owner';

  searchCondition = {
    title: true,
    owner: true,
    material_type: true
  };

  MAT_TYPE_SORT_LEVEL = {
    folder: 0,
    video: 1,
    pdf: 2,
    image: 3,
    normal: 4
  };
  MAT_OWNER_SORT_LEVEL = {
    Admin: 0,
    Me: 1,
    Other: 2
  };

  hideMaterials = [];
  constructor(
    public materialService: MaterialService,
    public storeService: StoreService,
    private dialogRef: MatDialogRef<MaterialBrowserComponent>,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data) {
      this.multiple = this.data.multiple;
      this.onlyMine = this.data.onlyMine;

      if (this.data.resultMatType) {
        this.resultMatType = this.data.resultMatType;
      }

      if (this.data.material_type) {
        this.material_type = this.data.material_type;
      }

      if (!this.multiple) {
        this.DISPLAY_COLUMNS.splice(0, 1);
      }

      if (this.data.hideMaterials) {
        this.data.hideMaterials.forEach((e) => {
          this.hideMaterials.push(e._id);
        });
      }

      if (this.data.materials) {
        this.data.materials.forEach((e) => {
          this.selection.push(e._id);
        });
      }
    }

    const profile = this.userService.profile.getValue();
    this.user_id = profile._id;

    this.loadSubscription = this.storeService.materials$.subscribe(
      (materials) => {
        materials.sort((a, b) => (a.folder ? -1 : 1));
        this.materials = materials.filter((e) => {
          if (this.hideMaterials.indexOf(e._id) !== -1) {
            return false;
          }
          const userId = e.user && e.user._id ? e.user._id : e.user;
          if (this.onlyMine) {
            if (e.role === 'admin') {
              return false;
            }
            if (userId !== this.user_id) {
              return false;
            }
          }
          if (this.material_type) {
            if (
              e.material_type !== 'folder' &&
              e.material_type !== this.material_type
            ) {
              return false;
            }
          }
          return true;
        });
        this.materials = _.uniqBy(this.materials, 'title');
        const folders = materials.filter((e) => {
          return e.material_type === 'folder';
        });
        this.folders = _.uniqBy(folders, 'title');
        this.folders.forEach((folder) => {
          this.foldersKeyValue[folder._id] = { ...folder };
        });

        const materialFolderMatch = {};
        folders.forEach((folder) => {
          folder.videos.forEach((e) => {
            materialFolderMatch[e] = folder._id;
          });
          folder.pdfs.forEach((e) => {
            materialFolderMatch[e] = folder._id;
          });
          folder.images.forEach((e) => {
            materialFolderMatch[e] = folder._id;
          });
        });

        materials.forEach((e) => {
          if (materialFolderMatch[e._id]) {
            e.folder = materialFolderMatch[e._id];
          }
        });

        if (this.materials.length) {
          for (const material of this.materials) {
            if (material.user) {
              if (material.user._id) {
                if (material.user._id === this.user_id) {
                  material.owner = 'Me';
                } else {
                  material.owner = material.user.user_name;
                }
              } else {
                if (material.user === this.user_id) {
                  material.owner = 'Me';
                } else {
                  material.owner = 'Unknown';
                }
              }
            } else {
              material.owner = 'Admin';
            }
            material.priority = material.priority || 0;
          }
        }

        this.selectedFolder = null;
        this.filter();
        this.sort(this.selectedSort, true);
      }
    );
  }

  ngOnInit(): void {
    // this.materialService.loadMaterial(false);
    this.materialService.loadOwn(true);
  }

  ngOnDestroy(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  clearSearchStr(): void {
    this.searchStr = '';
    this.filter();
  }

  filter(): void {
    const words = _.uniqBy(
      this.searchStr.split(' ').sort((a, b) => (a.length > b.length ? -1 : 1)),
      (e) => e.toLowerCase()
    );
    const reg = new RegExp(words.join('|'), 'gi');
    this.filteredMaterials = this.materials.filter((material) => {
      if (this.selectedFolder) {
        if (this.selectedFolder._id !== material.folder) {
          return false;
        }
      } else if (!this.isEnableSearchOptions() && material.folder) {
        return false;
      }
      if (this.matType && material.material_type != this.matType) {
        return false;
      }
      if (
        this.searchStr &&
        words.length &&
        _.uniqBy((material.title || '').match(reg), (e) => e.toLowerCase())
          .length !== words.length
      ) {
        return false;
      }
      return true;
    });
  }

  sort(field: string, keep: boolean = false): void {
    let gravity = 1;
    if (!keep) {
      if (this.selectedSort === field) {
        this.searchCondition[field] = !this.searchCondition[field];
      } else {
        this.selectedSort = field;
        this.searchCondition[field] = true;
      }
    } else {
      this.selectedSort = field;
      this.searchCondition[field] = this.searchCondition[field];
    }
    gravity = this.searchCondition[field] ? 1 : -1;
    if (field !== 'material_type') {
      this.filteredMaterials = this.filteredMaterials.sort((a, b) => {
        const aMatType = a.material_type === 'folder' ? 'folder' : 'normal';
        const bMatType = b.material_type === 'folder' ? 'folder' : 'normal';
        if (aMatType === bMatType) {
          const aOwner =
            a.owner !== 'Admin' && a.owner !== 'Me' ? 'Other' : a.owner;
          const bOwner =
            b.owner !== 'Admin' && b.owner !== 'Me' ? 'Other' : b.owner;
          if (field === 'owner') {
            if (aOwner === bOwner) {
              if (aOwner === 'Other') {
                if (a.owner < b.owner) {
                  return -1 * gravity;
                } else {
                  return 1 * gravity;
                }
              } else if (aOwner === 'Admin') {
                if (a.material_type === b.material_type) {
                  if (a.priority < b.priority) {
                    return -1;
                  } else if (a.priority > b.priority) {
                    return 1;
                  } else {
                    return 0;
                  }
                } else {
                  return (
                    this.MAT_TYPE_SORT_LEVEL[a.material_type] -
                    this.MAT_TYPE_SORT_LEVEL[b.material_type]
                  );
                }
              } else if (aOwner === 'Me') {
                if (a.material_type === b.material_type) {
                  if (
                    (a.title || '').toLowerCase() <
                    (b.title || '').toLowerCase()
                  ) {
                    return -1;
                  } else {
                    return 1;
                  }
                } else {
                  return (
                    this.MAT_TYPE_SORT_LEVEL[a.material_type] -
                    this.MAT_TYPE_SORT_LEVEL[b.material_type]
                  );
                }
              }
            } else {
              return (
                (this.MAT_OWNER_SORT_LEVEL[aOwner] -
                  this.MAT_OWNER_SORT_LEVEL[bOwner]) *
                gravity
              );
            }
          } else {
            const aFieldVal =
              field === 'title' ? (a[field] || '').toLowerCase() : a[field];
            const bFieldVal =
              field === 'title' ? (b[field] || '').toLowerCase() : b[field];
            if (aFieldVal < bFieldVal) {
              return -1 * gravity;
            }
            if (aFieldVal > bFieldVal) {
              return 1 * gravity;
            }
            if (aOwner === bOwner) {
              if (aOwner === 'Other') {
                if (a.owner < b.owner) {
                  return -1;
                } else {
                  return 1;
                }
              } else if (aOwner === 'Admin') {
                if (a.priority < b.priority) {
                  return -1;
                } else if (a.priority < b.priority) {
                  return 1;
                } else {
                  return 0;
                }
              } else if (aOwner === 'Me') {
                if (
                  (a.title || '').toLowerCase() < (b.title || '').toLowerCase()
                ) {
                  return -1;
                } else {
                  return 1;
                }
              }
            } else {
              return (
                this.MAT_OWNER_SORT_LEVEL[aOwner] -
                this.MAT_OWNER_SORT_LEVEL[bOwner]
              );
            }
          }
        } else {
          return (
            this.MAT_TYPE_SORT_LEVEL[aMatType] -
            this.MAT_TYPE_SORT_LEVEL[bMatType]
          );
        }
      });
    } else {
      this.filteredMaterials = this.filteredMaterials.sort((a, b) => {
        if (a.material_type === b.material_type) {
          const aOwner =
            a.owner !== 'Admin' && a.owner !== 'Me' ? 'Other' : a.owner;
          const bOwner =
            b.owner !== 'Admin' && b.owner !== 'Me' ? 'Other' : b.owner;
          if (aOwner === bOwner) {
            if (aOwner === 'Other') {
              if (a.owner < b.owner) {
                return -1;
              } else {
                return 1;
              }
            } else if (aOwner === 'Admin') {
              if (a.priority < b.priority) {
                return -1;
              } else if (a.priority > b.priority) {
                return 1;
              } else {
                return 0;
              }
            } else {
              if (
                (a.title || '').toLowerCase() < (b.title || '').toLowerCase()
              ) {
                return -1;
              } else {
                return 1;
              }
            }
          } else {
            return (
              this.MAT_OWNER_SORT_LEVEL[aOwner] -
              this.MAT_OWNER_SORT_LEVEL[bOwner]
            );
          }
        } else {
          return (
            (this.MAT_TYPE_SORT_LEVEL[a.material_type] -
              this.MAT_TYPE_SORT_LEVEL[b.material_type]) *
            gravity
          );
        }
      });
    }
    this.filteredMaterials = [...this.filteredMaterials];
  }

  isEnableSearchOptions(): boolean {
    return !!(this.searchStr || this.matType);
  }

  isAllSelected(): boolean {
    const filteredMaterialIds = [];
    this.filteredMaterials.forEach((e) => {
      filteredMaterialIds.push(e._id);
    });
    const selectedMaterials = _.intersection(
      this.selection,
      filteredMaterialIds
    );
    return (
      this.filteredMaterials.length &&
      selectedMaterials.length === this.filteredMaterials.length
    );
  }

  isSelected(element: Material): boolean {
    const pos = this.selection.indexOf(element._id);
    if (pos !== -1) {
      return true;
    } else {
      return false;
    }
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.filteredMaterials.forEach((e) => {
        const pos = this.selection.indexOf(e._id);
        if (pos !== -1) {
          this.selection.splice(pos, 1);
        }
      });
    } else {
      this.filteredMaterials.forEach((e) => {
        const pos = this.selection.indexOf(e._id);
        if (pos === -1) {
          this.selection.push(e._id);
        }
      });
    }
  }

  clearSelection(): void {
    this.selection = [];
  }

  toggleElement(element: Material): void {
    const pos = this.selection.indexOf(element._id);
    if (pos !== -1) {
      this.selection.splice(pos, 1);
    } else {
      this.selection.push(element._id);
    }
  }

  getMaterialById(id): any {
    const index = this.materials.findIndex((item) => item._id === id);
    if (index >= 0) {
      return this.materials[index];
    }
    return null;
  }

  capitalizeFirstLetter(type: string): any {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  openFolder(element: Material): void {
    this.selectedFolder = element;
    this.filter();
    this.sort(this.selectedSort, true);
  }

  toRoot(): void {
    this.selectedFolder = null;
    this.filter();
    this.sort(this.selectedSort, true);
  }

  changeFileType(type: string): void {
    this.matType = type;
    this.filter();
  }

  select(): void {
    const selectedMaterials = [];
    for (const selectedMaterial of this.selection) {
      if (this.getMaterialById(selectedMaterial)) {
        selectedMaterials.push(this.getMaterialById(selectedMaterial));
      }
    }

    const filteredFolders = this.folders.filter((e) => {
      if (this.selection.indexOf(e._id) !== -1) {
        return true;
      }
    });
    const filteredFolderIds = filteredFolders.map((e) => e._id);
    const folderMaterials = this.materials.filter((e) => {
      if (filteredFolderIds.indexOf(e.folder) !== -1) {
        return true;
      }
    });

    if (this.resultMatType === 'material') {
      this.dialogRef.close({
        materials: [...folderMaterials, ...selectedMaterials]
      });
    } else {
      this.dialogRef.close({
        materials: [...filteredFolders, ...selectedMaterials]
      });
    }
  }

  selectMaterial(element: Material): void {
    if (this.multiple) {
      return;
    }
    if (element.material_type === 'folder') {
      return;
    }
    this.selection = [element._id];
  }
}
