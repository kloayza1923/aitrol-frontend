import { RecentUploads } from '@/pages/public-profile/profiles/default';
import {
  BasicSettings,
  CalendarAccounts,
  CommunityBadges,
  Connections,
  EditablePersonalInfo,
  PasswordSettings,
  StartNow,
  Work
} from './blocks';

const AccountUserProfileContent = () => {
  return (
    <div className="space-y-6">
      <EditablePersonalInfo />
    </div>
  );
};

export { AccountUserProfileContent };
