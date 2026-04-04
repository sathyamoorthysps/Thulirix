import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
    },
  });

  const {
    register: regPassword,
    handleSubmit: submitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = (data: ProfileForm) => {
    // Would call API to update profile
    toast.success('Profile updated');
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    // Would call API to change password
    toast.success('Password changed');
    resetPassword();
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-700">Profile</h2>
        </div>

        <form onSubmit={submitProfile(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First Name</label>
              <input {...regProfile('firstName')} className={inputClass} />
              {profileErrors.firstName && (
                <p className="mt-1 text-xs text-red-600">{profileErrors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input {...regProfile('lastName')} className={inputClass} />
              {profileErrors.lastName && (
                <p className="mt-1 text-xs text-red-600">{profileErrors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input {...regProfile('email')} type="email" className={inputClass} disabled />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-700">Change Password</h2>
        </div>

        <form onSubmit={submitPassword(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className={labelClass}>Current Password</label>
            <input {...regPassword('currentPassword')} type="password" className={inputClass} />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">{passwordErrors.currentPassword.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>New Password</label>
            <input {...regPassword('newPassword')} type="password" className={inputClass} />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input {...regPassword('confirmPassword')} type="password" className={inputClass} />
            {passwordErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
