import { redirect } from 'next/navigation';

const AccountPage = () => {
  // Redirect to the profile page as the default account view
  redirect('/account/profile');
  return null; // Or a loading spinner if needed before redirect
};

export default AccountPage;