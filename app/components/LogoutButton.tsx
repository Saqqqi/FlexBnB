'use client';

import { SignOutButton, useClerk } from "@clerk/nextjs";
import MenuLink from "./navbar/MenuLink";

const LogoutButton: React.FC = () => {
  const { signOut } = useClerk();

  return (
    <div
      onClick={() => {
        signOut(() => {
          window.location.href = "/";
        });
      }}
    >
      <MenuLink label="Log-Out" onClick={() => {}} />
    </div>
  );
};

export default LogoutButton;





