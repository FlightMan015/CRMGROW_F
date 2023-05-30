import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  isConnected = false;
  isJoined = false;
  notification: BehaviorSubject<any> = new BehaviorSubject(null);
  notification$ = this.notification.asObservable();
  command: BehaviorSubject<any> = new BehaviorSubject(null);
  command$ = this.command.asObservable();

  constructor(private socket: Socket, private userService: UserService) {
    this.socket.on('connected', () => {
      this.isConnected = true;

      const profile = this.userService.profile.getValue();
      if (profile && profile._id) {
        this.connect();
      }
    });

    this.socket.on('joined', () => {
      console.log('socket: joined');
      this.isJoined = true;
    });

    this.socket.on('notification', (data) => {
      this.notification.next(data);
    });
    this.socket.on('command', (data) => {
      this.command.next({ command: data });
    });

    this.socket.on('load_notification', (data) => {
      console.log('socket command', data);
      this.command.next({ command: 'load_notification', query: data });
    });

    this.socket.on('disconnect', () => {
      console.log('socket: disconnect from socket');
      this.isConnected = false;
      this.isJoined = false;
    });
  }

  connect(): void {
    if (this.isJoined) {
      return;
    }
    const token = localStorage.getItem('token');
    if (token) {
      console.log('socket: join request');
      this.socket.emit('join', { token });
    }
  }

  disconnect(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.socket.emit('leave', { token });
      this.isJoined = false;
    }
  }

  clear$(): void {
    this.disconnect();
    this.notification.next(null);
    this.command.next(null);
  }
}
