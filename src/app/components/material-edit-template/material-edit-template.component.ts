import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { Garbage } from 'src/app/models/garbage.model';
import { THEMES } from 'src/app/constants/variable.constants';

@Component({
  selector: 'app-material-edit-template',
  templateUrl: './material-edit-template.component.html',
  styleUrls: ['./material-edit-template.component.scss']
})
export class MaterialEditTemplateComponent implements OnInit {
  garbage: Garbage = new Garbage();
  theme_setting = {};
  materials = [];
  selectedTheme = {
    name: '',
    thumbnail: '',
    id: ''
  };
  saving = false;
  themes = THEMES;
  garbageSubscription: Subscription;
  updateSubscription: Subscription;
  themesListSubscription: Subscription;

  isGlobal: boolean = false;

  constructor(
    private dialogRef: MatDialogRef<MaterialEditTemplateComponent>,
    private userService: UserService,
    private toast: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data.isGlobal) {
      this.isGlobal = true;
    } else {
      if (this.data.id) {
        this.materials = [this.data.id];
      }
      if (this.data.materials) {
        this.materials = this.data.materials.map((e) => e._id);
      }
    }
    this.themesListSubscription && this.themesListSubscription.unsubscribe();
    this.themesListSubscription = this.userService.themes$.subscribe(
      (themes) => {
        this.themes = themes;
        this.selectedTheme = this.themes[0];
      }
    );

    this.garbageSubscription = this.userService.garbage$.subscribe(
      (garbage) => {
        let theme;
        const profile = this.userService.profile.getValue();
        this.garbage = new Garbage().deserialize(garbage);
        if (this.isGlobal) {
          let defaultTheme = 'theme2';
          if (profile.company.toLowerCase() !== 'exp realty') {
            defaultTheme = 'theme7';
          }
          theme = garbage.material_theme || defaultTheme;
          this.selectedTheme = this.themes.filter((e) => e.id == theme)[0];
        } else {
          if (this.materials.length > 1) {
            theme = garbage.material_theme;
            this.selectedTheme = this.themes.filter((e) => e.id == theme)[0];
          } else {
            const material = this.materials[0];
            this.theme_setting = garbage.material_themes || {};
            if (garbage.material_themes && garbage.material_themes[material]) {
              theme = garbage.material_themes[material];
            } else {
              theme = garbage.material_theme;
            }
            this.selectedTheme = this.themes.filter((e) => e.id == theme)[0];
          }
          this.theme_setting = garbage.material_themes || {};
        }
      }
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.themesListSubscription && this.themesListSubscription.unsubscribe();
  }

  setMaterialTheme(theme: any): void {
    this.selectedTheme = theme;
  }

  save(): void {
    if (!this.selectedTheme || !this.selectedTheme.id) {
      return;
    }
    this.saving = true;
    if (this.isGlobal) {
      this.updateSubscription = this.userService
        .updateGarbage({ material_theme: this.selectedTheme.id })
        .subscribe((status) => {
          this.saving = false;
          if (status) {
            this.userService.updateGarbageImpl({
              material_theme: this.selectedTheme.id
            });
            this.dialogRef.close(this.selectedTheme.name);
            // this.toast.success(
            //   'Material template has been changed successfully.'
            // );
          }
        });
    } else {
      for (let i = 0; i < this.materials.length; i++) {
        this.theme_setting[this.materials[i]] = this.selectedTheme.id;
      }
      this.updateSubscription = this.userService
        .updateGarbage({ material_themes: this.theme_setting })
        .subscribe((status) => {
          this.saving = false;
          if (status) {
            this.userService.updateGarbageImpl({
              material_themes: this.theme_setting
            });
            this.dialogRef.close(this.selectedTheme.name);
            // this.toast.success(
            //   'Material template has been changed successfully.'
            // );
          }
        });
    }
  }
}
