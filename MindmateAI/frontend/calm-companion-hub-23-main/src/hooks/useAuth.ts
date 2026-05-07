import { useUser, useClerk } from "@clerk/clerk-react";

export function useAuth() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const signOut = async () => {
    await clerkSignOut();
  };

  return {
    user: isSignedIn ? user : null,
    isSignedIn: !!isSignedIn,
    loading: !isLoaded,
    signOut,
  };
}
