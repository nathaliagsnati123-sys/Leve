import React from 'react';

interface UserAvatarProps {
  avatar?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const isImageAvatar = (avatar?: string): boolean => {
  if (!avatar) return false;
  const trimmed = avatar.trim();
  return trimmed.startsWith('data:image') || 
         trimmed.startsWith('http://') || 
         trimmed.startsWith('https://') || 
         trimmed.startsWith('blob:') ||
         trimmed.startsWith('/');
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name,
  size = 'md',
  className = ''
}) => {
  const isImage = isImageAvatar(avatar);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 sm:w-9 sm:h-9 text-sm sm:text-base',
    lg: 'w-11 h-11 text-lg',
    xl: 'w-16 h-16 text-2xl'
  }[size];

  if (isImage && avatar) {
    return (
      <div className={`rounded-full overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 ${sizeClasses} ${className}`}>
        <img
          src={avatar}
          alt={name || 'Avatar'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 border border-emerald-300/40 dark:border-emerald-800/60 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 select-none ${sizeClasses} ${className}`}
    >
      <span>{avatar || '🌿'}</span>
    </div>
  );
};
