// project imports
import CommonAuthLayout from './CommonAuthLayout';
import { useAppPreferences } from 'contexts/AppPreferences';
import AuthLogin from 'sections/auth/AuthLogin';

// ==============================|| LOGIN ||============================== //

export default function Login() {
  const { t } = useAppPreferences();

  return (
    <CommonAuthLayout
      title={t('auth.title')}
      subHeading={t('auth.subtitle')}
    >
      {/* Login form */}
      <AuthLogin />
    </CommonAuthLayout>
  );
}
