import * as _ from 'lodash';
import { PACKAGE_LEVEL } from '../constants/variable.constants';
import { Contact } from '../models/contact.model';

export function validateEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,4}$/gim;
  if (email == '' || !re.test(email)) {
    return false;
  }
  return true;
}

export function sortStringArray(
  array: any[],
  field: string,
  ascending = true
): any[] {
  if (array.length > 0) {
    const searchDirection = ascending ? 'asc' : 'desc';
    if (field === 'title') {
      array = _.orderBy(
        array,
        [(e) => (e?.title || '').toLowerCase()],
        [searchDirection]
      );
    } else if (field === 'subject') {
      array = _.orderBy(
        array,
        [(e) => (e?.subject || '').toLowerCase()],
        [searchDirection]
      );
    } else if (field === 'contacts') {
      array = _.orderBy(
        array,
        [
          (e) =>
            e.contacts && e.contacts.length > 0
              ? (e.contacts[0].first_name === '' &&
                e.contacts[0].last_name === ''
                  ? 'Unnamed Contact'
                  : e.contacts[0].first_name + ' ' + e.contacts[0].last_name
                ).toLowerCase()
              : ''
        ],
        [searchDirection]
      );
    } else {
      array = _.orderBy(array, [field], [searchDirection]);
    }
    return array;
  }
  return [];
}

export function sortDateArray(
  array: any[],
  field: string,
  ascending = true
): any[] {
  if (array.length > 0) {
    const searchDirection = ascending ? 'asc' : 'desc';
    if (field === 'inquired') {
      array = _.orderBy(array, (o) => new Date(o['created_at']), [
        searchDirection
      ]);
    } else if (field === 'proposed') {
      array = _.orderBy(array, (o) => new Date(o['proposed_at'][0]), [
        searchDirection
      ]);
    } else if (field === 'schedule') {
      array = _.orderBy(
        array,
        (o) => (o['confirmed_at'] ? new Date(o['confirmed_at']) : new Date()),
        [searchDirection]
      );
    }
    array = _.orderBy(array, (o) => new Date(o[field]), [searchDirection]);
    return array;
  }
  return [];
}

export function sortObjectArray(
  array: any[],
  field: string,
  ascending = true
): any[] {
  if (array.length > 0) {
    const searchDirection = ascending ? 'asc' : 'desc';
    if (field === 'organizer') {
      array = _.orderBy(
        array,
        [(e) => (e?.user.user_name || '').toLowerCase()],
        [searchDirection]
      );
    } else if (field === 'leader') {
      array = _.orderBy(
        array,
        [(e) => (e?.leader.user_name || '').toLowerCase()],
        [searchDirection]
      );
    } else {
      array = _.orderBy(array, [field], [searchDirection]);
    }
    return array;
  }
  return [];
}

export function getUserLevel(level): string {
  if (level) {
    return level.toUpperCase();
  }
  // return PACKAGE_LEVEL.LITE.package;
  return PACKAGE_LEVEL.PRO.package;
  // return PACKAGE_LEVEL.ELITE.package;
  // return PACKAGE_LEVEL.CUSTOM.package;
}

export function getContactHTML(contact: Contact): string {
  if (contact) {
    const html = `
      <div class="contact-member">
      <div class="main-info">
          <div class="picture">
            ${contact.avatarName}
          </div>
          <div class="full-name">
            ${contact.fullName}
          </div>
      </div>
    </div>
    `;
    return html;
  } else {
    return '';
  }
}

const NOTIFICATIONS = {
  team_invited: `{who} has invited you to the team {team}`,
  team_accept: `{who} has accepted your invitation to the team {team}`,
  team_reject: `{who} has rejected your invitation to the team {team}`,
  team_requested: `{who} has sent join request to the team {team}`,
  join_accept: `{who} has accepted your team join request for the team {team}`,
  join_reject: `{who} has rejected your team join request for the team {team}`,
  team_remove: `{team} has removed by owner {who}`,
  team_member_remove: `You have been removed from the team {team} by {who}`,
  team_role_change: 'Your role has been changed in the team {team} by {who}',
  share_automation:
    '{who} has shared the automation {detail} in the team {team}',
  stop_share_automation:
    '{who} has removed the automation {detail} from the team {team}',
  share_template: '{who} has shared the template {detail} in the team {team}',
  stop_share_template:
    '{who} has removed the template {detail} from the team {team}',
  contact_shared: '{who} has shared the contact {detail} in the team {team}',
  stop_share_contact:
    '{who} has remove the contact {detail} from the team {team}',
  share_material: '{who} has shared {detail} in the team {team}',
  stop_share_material: '{who} has removed {detail} in the team {team}',
  material_track: '{who} has watched {material} {detail}',
  unsubscribe: '{who} has unsubscribed the emails from you.',
  open_email: '{who} has opened email from you.',
  click_link: '{who} has clicked the link from your email.'
};
export function getNotificationDetail(notification): string {
  let creator = '';
  if (notification.creator) {
    creator = `<span class="creator">${notification.creator.user_name}</span>`;
  } else {
    creator = 'Someone';
  }
  let team = '<a>Unknown Team</a>';
  let contact;
  let detail;
  let material;
  let content = '';
  switch (notification.criteria) {
    case 'bulk_sms':
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        creator = `<a>${contact.fullName}</a>`;
      }
      if (notification.status === 'sent') {
        content = `Texting to ${creator} is failed.`;
      } else if (notification.status === 'completed') {
        if (notification.deliver_status) {
          const failed = notification.deliver_status.failed.length;
          const succeed = notification.deliver_status.succeed.length;
          if (!failed) {
            detail = 'All are delivered successfully';
          } else {
            detail = `${failed} of ${failed + succeed} texts are failed.`;
          }
        }
        content = `Bulk Texting is completed. ${detail}`;
      } else if (notification.status === 'delivered') {
        content = 'Text is delivered successfully.';
      } else if (notification.status === 'undelivered') {
        content = 'Text is failed.';
      } else {
        content = 'Bulk Texting is pending now.';
      }
      break;
    case 'bulk_text':
      if (notification.status === 'pending') {
        content = `Texting result checking is progressing. Texting is failed for ${notification.deliver_status?.failed?.length} contacts`;
      } else if (notification.status === 'completed') {
        if (notification.deliver_status) {
          const failed = notification.deliver_status?.failed?.length;
          const total = notification.contact?.length;
          if (!failed) {
            detail = `All of ${total} texts are sent successfully.`;
          } else {
            detail = `${failed} of ${total} texts are failed.`;
          }
        }
        content = `Texting result checking is completed. ${detail}`;
      } else {
        content = 'Bulk text sending is pending now';
      }
      break;
    case 'assign_automation':
      if (notification.status === 'pending') {
        const total = notification.contact?.length;
        content = `Automation is assigning to ${total} contacts.`;
      } else if (notification.status === 'completed') {
        if (notification.deliver_status) {
          const failed = notification.deliver_status?.failed?.length;
          const total = notification.contact?.length;
          if (!failed) {
            detail = `All of ${total} automations are assigned successfully.`;
          } else {
            detail = `${failed} of ${total} automation assignings are failed.`;
          }
        }
        content = `Automation bulk assigning is completed. ${detail}`;
      } else {
        content = 'Automation bulk assigning is pending now.';
      }
      break;
    case 'automation_completed':
      const title = notification.detail?.title || '';
      if (notification.contact && notification.contact.length) {
        const contact = new Contact().deserialize(notification.contact[0]);
        content = `Contact automation${
          title ? '(' + title + ')' : ''
        } which is assigned to <a>${contact.fullName}</a> are completed.`;
      } else if (notification.deal && notification.deal.length) {
        const deal = notification.deal[0];
        content = `Deal automation${
          title ? '(' + title + ')' : ''
        } which is assigned to <a>deal: ${deal.title}</a> are completed.`;
      } else {
        content = notification.content;
      }
      break;
    case 'bulk_email':
      if (notification.status === 'pending') {
        content = `Bulk emailing is progressing. Emailing is failed for ${notification.deliver_status?.failed?.length} contacts`;
      } else if (notification.status === 'completed') {
        if (notification.deliver_status) {
          const failed = notification.deliver_status?.failed?.length;
          const total = notification.contact?.length;
          if (!failed) {
            detail = `All of ${total} emails are sent successfully.`;
          } else {
            detail = `${failed} of ${total} emails are failed.`;
          }
        }
        content = `Emailing is completed. ${detail}`;
      } else {
        content = 'Bulk Emailing sending is pending now';
      }
      break;
    case 'team_invited':
    case 'team_accept':
    case 'team_reject':
    case 'team_requested':
    case 'join_accept':
    case 'join_reject':
    case 'team_remove':
    case 'team_member_remove':
    case 'team_role_change':
      if (notification.team) {
        team = `<a>${notification.team.name}</a>`;
      } else if (notification.content) {
        return notification.content;
      }
      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      content = content.replace('{team}', team);
      break;
    case 'share_automation':
    case 'stop_share_automation':
      if (
        notification.action &&
        notification.action.automation &&
        notification.action.automation.length
      ) {
        detail = `<a>${notification.action.automation[0].title}</a>`;
      } else if (notification.content) {
        return notification.content;
      } else {
        detail = '<a>Unknown Automation</a>';
      }
      content = NOTIFICATIONS[notification.criteria];
      content = content.replace('{who}', creator);
      content = content.replace('{detail}', detail);
      if (notification.team) {
        team = `<a>${notification.team.name}</a>`;
      } else {
        team = `<a>Unkown Team</a>`;
      }
      content = content.replace('{team}', team);
      break;
    case 'share_template':
    case 'stop_share_template':
      if (
        notification.action &&
        notification.action.template &&
        notification.action.template.length
      ) {
        detail = `<a>${notification.action.template[0].title}</a>`;
      } else if (notification.content) {
        return notification.content;
      } else {
        detail = '<a>Unknown Template</a>';
      }
      content = NOTIFICATIONS[notification.criteria];
      content = content.replace('{who}', creator);
      content = content.replace('{detail}', detail);
      if (notification.team) {
        team = `<a>${notification.team.name}</a>`;
      } else {
        team = `<a>Unkown Team</a>`;
      }
      content = content.replace('{team}', team);
      break;
    case 'share_material':
    case 'stop_share_material':
      if (
        notification.action &&
        notification.action.object &&
        notification.action[notification.action.object] &&
        notification.action[notification.action.object].length
      ) {
        detail = `the ${notification.action.object} <a>${
          notification.action[notification.action.object][0].title
        }</a>`;
      } else if (
        notification.action.video.length ||
        notification.action.pdf.length ||
        notification.action.image.length
      ) {
        const videos = [];
        const pdfs = [];
        const images = [];
        const contents = [];
        let noEmptyCount = 0;
        notification.action.video.forEach((e) =>
          videos.push(`<a>${e.title}</a>`)
        );
        notification.action.pdf.forEach((e) => pdfs.push(`<a>${e.title}</a>`));
        notification.action.image.forEach((e) =>
          images.push(`<a>${e.title}</a>`)
        );
        if (notification.action.video.length) {
          noEmptyCount++;
          contents.push(`the videos ${videos.join(',')}`);
        }
        if (notification.action.pdf.length) {
          noEmptyCount++;
          contents.push(`the pdfs ${pdfs.join(',')}`);
        }
        if (notification.action.image.length) {
          noEmptyCount++;
          contents.push(`the images ${images.join(',')}`);
        }
        if (noEmptyCount > 1) {
          detail = `the materials ${[...videos, ...pdfs, ...images].join(',')}`;
        } else {
          detail = contents;
        }
      } else if (notification.content) {
        return notification.content;
      } else {
        detail = '<a>Unknown Material</a>';
      }
      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      content = content.replace('{detail}', detail);
      if (notification.team) {
        team = `<a>${notification.team.name}</a>`;
      } else {
        team = `<a>Unkown Team</a>`;
      }
      content = content.replace('{team}', team);
      break;
    case 'contact_shared':
    case 'stop_share_contact':
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        detail = `<a>${contact.fullName}</a>`;
      } else if (notification.content) {
        return notification.content;
      } else {
        detail = '<a>Unknown Contact</a>';
      }
      content = NOTIFICATIONS[notification.criteria];
      content = content.replace('{who}', creator);
      content = content.replace('{detail}', detail);
      if (notification.team) {
        team = `<a>${notification.team.name}</a>`;
      } else {
        team = `<a>Unkown Team</a>`;
      }
      content = content.replace('{team}', team);
      break;
    case 'open_email':
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        creator = `<a>${contact.fullName}</a>`;
      }

      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      break;
    case 'click_link':
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        creator = `<a>${contact.fullName}</a>`;
      }

      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      break;
    case 'unsubscribe':
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        creator = `<a>${contact.fullName}</a>`;
      }

      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      break;
    case 'material_track':
      if (
        notification.action &&
        notification.action.object &&
        notification.action[notification.action.object] &&
        notification.action[notification.action.object].length
      ) {
        material = `the ${notification.action.object} <a>${
          notification.action[notification.action.object][0].title
        }</a>`;
      } else {
        content = NOTIFICATIONS[notification.criteria] || '';
        content = content.replace('{who}', 'Someone');
        content = content.replace('{detail}', '');
        content = content.replace('{material}', 'your material');
      }
      if (notification.action && notification.video_tracker) {
        const duration = Math.round(notification.video_tracker.duration / 1000);
        detail = `for ${getDuration(duration * 1000)}`;
      } else {
        detail = '';
      }
      if (notification.contact && notification.contact.length) {
        contact = new Contact().deserialize(notification.contact[0]);
        creator = `<a>${contact.fullName}</a>`;
      }

      content = NOTIFICATIONS[notification.criteria] || '';
      content = content.replace('{who}', creator);
      content = content.replace('{material}', material);
      content = content.replace('{detail}', detail);
      break;
    case 'dialer_call':
      if (notification && notification.contact && notification.contact.length) {
        content = 'Called to ' + notification.contact.length + ' contact(s)';
      } else {
        content = 'Called to someone';
      }
      break;
    default:
      content = notification.content;
      break;
  }
  return content;
}

export function getDuration(value): string {
  let input = 0;
  try {
    input = parseInt(value);
  } catch (err) {
    return '';
  }
  if (isNaN(input)) {
    return '';
  }
  if (input < 0) {
    input = 0;
  }
  const dateObj = new Date(input);
  const hours = dateObj.getUTCHours();
  const hourString = hours.toString();
  const minutes = dateObj.getUTCMinutes().toString();
  const seconds = dateObj.getSeconds().toString().padStart(2, '0');
  if (hours) {
    const timeString =
      hourString + ':' + minutes.padStart(2, '0') + ':' + seconds;
    return timeString;
  } else {
    return minutes + ':' + seconds;
  }
}

export function isEmptyHtml(html): boolean {
  const a = document.createElement('div');
  a.innerHTML = html;
  return !(a.innerText || '').trim();
}
