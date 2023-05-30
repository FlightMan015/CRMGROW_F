import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as moment from 'moment';
import { Note } from 'src/app/models/note.model';
import { DealsService } from 'src/app/services/deals.service';
import { NoteService } from 'src/app/services/note.service';
import { isEmptyHtml } from 'src/app/utils/functions';
import { HtmlEditorComponent } from '../html-editor/html-editor.component';

@Component({
  selector: 'app-note-edit',
  templateUrl: './note-edit.component.html',
  styleUrls: ['./note-edit.component.scss']
})
export class NoteEditComponent implements OnInit {
  audioFile;

  saving = false;
  note: Note = new Note();
  contact: string = '';

  // Deal Relative Data
  formType = '';
  dealName: string = '';

  @ViewChild('editor') htmlEditor: HtmlEditorComponent;

  constructor(
    private dialogRef: MatDialogRef<NoteEditComponent>,
    private noteService: NoteService,
    private dealService: DealsService,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    if (this.data) {
      if (this.data.type === 'deal') {
        this.formType = 'deal';
        this.note = { ...this.note, ...this.data.note };
        this.dealName = this.data.deal_name;
      } else {
        this.note = { ...this.note, ...this.data.note };
      }
      this.contact = this.data.contact_name;
    }
  }

  ngOnInit(): void {}

  update(): void {
    if (!this.note.content || isEmptyHtml(this.note.content)) {
      return;
    }
    const formData = new FormData();
    if (this.audioFile) {
      const file = new File([this.audioFile], 'audio.wav');
      formData.append('audio', file);
    }
    if (this.formType === 'deal') {
      const data = { ...this.note, note: this.note._id, _id: undefined };
      formData.append('data', JSON.stringify(data));
      this.saving = true;
      this.dealService.editNote(formData).subscribe((status) => {
        if (status) {
          this.saving = false;
          this.dialogRef.close(this.note);
        }
      });
    } else {
      for (const key in this.note) {
        formData.append(key, this.note[key]);
      }
      this.saving = true;
      this.noteService.update(this.note._id, formData).subscribe((res) => {
        if (res) {
          this.saving = false;
          this.dialogRef.close(this.note);
        }
      });
    }
  }

  /**
   * Insert the audio note to the content
   * @param $event: {file, url, content}
   */
  insertAudioNote($event: any): void {
    if ($event.file) {
      this.htmlEditor.insertNote({
        content: '',
        created_at: moment().format('YYYY-MM-DD HH:mm a')
      });
      this.audioFile = $event.file;
    }
  }

  /**
   * Remove the audio note from content
   */
  removeAudioNote(): void {
    this.note.audio = '';
    const contents = this.htmlEditor.emailEditor.quillEditor.getContents();
    const ops = contents.ops || [];
    contents.ops.some((e, index) => {
      if (e.insert?.audioNote) {
        ops.splice(index, 1);
        this.htmlEditor.emailEditor.quillEditor.setContents({ ops });
        return true;
      }
    });
  }
}
