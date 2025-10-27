import React from 'react';

interface UserAvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ initials, size = "md" }) => {
  const sizeClasses: Record<'sm' | 'md' | 'lg', string> = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-md",
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-600 to-blue-500 border-2 border-white/30 flex items-center justify-center font-bold shadow-lg text-white`}>
      {initials}
    </div>
  );
};

export default UserAvatar;
