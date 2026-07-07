// app/components/AddPropertyButton.tsx
'use client';

import { useUser, SignInButton } from "@clerk/nextjs";
import UseAddPropertyModal from "@/app/Hooks/UseAddPropertyModal";

interface AddPropertyButtonProps {
    isScrolled?: boolean;
}

const AddPropertyButton = ({ isScrolled = false }: AddPropertyButtonProps) => {
    const { isSignedIn } = useUser();
    const addPropertyModal = UseAddPropertyModal();

    const handleClick = () => {
        if (isSignedIn) {
            addPropertyModal.open();
        }
    };

    return (
        <>
            {isSignedIn ? (
                <button
                    onClick={handleClick}
                    className={`hidden sm:block px-4 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                        isScrolled
                            ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            : 'text-white hover:bg-white/20 hover:text-white'
                    }`}
                >
                    <span className="flex items-center gap-2">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Flexbnb Your Home
                    </span>
                </button>
            ) : (
                <SignInButton mode="modal">
                    <button
                        className={`hidden sm:block px-4 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                            isScrolled
                                ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                : 'text-white hover:bg-white/20 hover:text-white'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                            Flexbnb Your Home
                        </span>
                    </button>
                </SignInButton>
            )}
        </>
    );
};

export default AddPropertyButton;