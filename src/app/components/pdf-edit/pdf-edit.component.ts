import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { MaterialService } from 'src/app/services/material.service';
import { HelperService } from 'src/app/services/helper.service';
import { HtmlEditorComponent } from '../html-editor/html-editor.component';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { Material } from 'src/app/models/material.model';
import { MatDialog } from '@angular/material/dialog';
import { MaterialChangeComponent } from 'src/app/components/material-change/material-change.component';

@Component({
  selector: 'app-pdf-edit',
  templateUrl: './pdf-edit.component.html',
  styleUrls: ['./pdf-edit.component.scss']
})
export class PdfEditComponent implements OnInit, OnDestroy {
  submitted = false;
  pdf: Material = new Material();
  saving = false;
  thumbnailLoading = false;

  editedPdfs = [];
  garbageSubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<PdfEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toast: ToastrService,
    private materialService: MaterialService,
    private userService: UserService,
    private helperService: HelperService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.pdf = { ...this.data.material };
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        this.editedPdfs = _garbage.edited_pdf || [];
      }
    );
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
  }

  update(): void {
    this.saving = true;
    const pdf = {};
    const keys = ['title', 'preview', 'description'];
    keys.forEach((e) => {
      if (this.pdf[e] != this.data.material[e]) {
        pdf[e] = this.pdf[e];
      }
    });
    if (this.pdf['role'] === 'admin') {
      this.materialService
        .updateAdminPdf(this.pdf['_id'], pdf)
        .subscribe((res) => {
          this.saving = false;
          if (res && res['status']) {
            const newMaterial = new Material().deserialize(res['data']);
            newMaterial.material_type = 'pdf';
            this.materialService.create$(newMaterial);
            this.editedPdfs.push(this.pdf._id);
            this.userService.updateGarbageImpl({
              edited_pdf: this.editedPdfs
            });
            this.materialService.delete$([this.pdf._id]);
            // this.toast.success('Pdf material successfully duplicated.');
            this.dialogRef.close();
          }
        });
    } else {
      this.materialService.updatePdf(this.pdf['_id'], pdf).subscribe((res) => {
        this.saving = false;
        if (res && res['status']) {
          // this.toast.success('Pdf material successfully edited.');
          this.materialService.update$(this.pdf['_id'], this.pdf);
          this.dialogRef.close();
        }
      });
    }
  }

  duplicate(): void {
    this.saving = true;
    if (this.pdf.role == 'admin') {
      const pdf: Material = new Material();
      pdf.title = this.pdf.title;
      pdf.description = this.pdf.description;
      pdf.url = this.pdf.url;
      pdf.type = this.pdf.type;
      pdf.folder = this.pdf.folder;
      pdf.company = this.pdf.company;
      pdf.preview = this.pdf.preview;
      // custom thumbnail
      pdf.material_theme = this.pdf.material_theme;
      // uploaded & recording
      pdf.default_edited = true;
      pdf.default_video = this.pdf._id;
      this.materialService.createPdf(pdf).subscribe((res) => {
        this.saving = false;
        if (res && res['status']) {
          const newMaterial = new Material().deserialize(res['data']);
          newMaterial.material_type = 'pdf';
          this.materialService.create$(newMaterial);
          if (newMaterial.folder) {
            // Folder Update
            this.materialService.updateFolder$(
              newMaterial.folder,
              'pdfs',
              newMaterial._id
            );
          } else {
            if (pdf.folder) {
              // Go to Admin
            }
          }
          // this.toast.success('Pdf material successfully duplicated.');
          this.dialogRef.close();
        }
      });
    } else {
      const pdf = {
        url: this.pdf.url,
        title: this.pdf.title,
        preview: this.pdf.preview,
        description: this.pdf.description,
        shared_pdf: this.pdf._id,
        folder: this.pdf.folder
      };
      this.saving = true;
      this.materialService.createPdf(pdf).subscribe((res) => {
        this.saving = false;
        if (res['data']) {
          // this.toast.success('Pdf material successfully duplicated.');
          const newMaterial = new Material().deserialize(res['data']);
          newMaterial.material_type = 'pdf';
          this.materialService.create$(newMaterial);
          this.materialService.update$(this.pdf._id, {
            has_shared: true,
            shared_pdf: newMaterial._id
          });
          if (newMaterial.folder) {
            // Folder Update
            this.materialService.updateFolder$(
              newMaterial.folder,
              'pdfs',
              newMaterial._id
            );
          }
          this.dialogRef.close();
        }
      });
    }
  }

  openPreviewDialog(): void {
    this.helperService
      .promptForImage()
      .then((imageFile) => {
        this.thumbnailLoading = true;
        this.helperService
          .generateImageThumbnail(imageFile)
          .then((thumbnail) => {
            this.thumbnailLoading = false;
            this.pdf['preview'] = thumbnail;
          })
          .catch(() => {
            this.thumbnailLoading = false;
            this.toast.error("Can't Load this image");
          });
      })
      .catch(() => {
        this.toast.error("Can't read this image");
      });
  }

  changeMaterial(): void {
    this.dialog
      .open(MaterialChangeComponent, {
        width: '100vw',
        maxWidth: '400px',
        disableClose: true,
        data: {
          material: this.pdf
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.pdf = {
            ...this.pdf,
            ...res
          };
        }
      });
  }
}
