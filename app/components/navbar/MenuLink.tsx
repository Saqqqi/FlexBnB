// app/components/MenuLink.tsx
'use client'

interface MenuLinkProps {
    label: string;
    onClick: () => void;
}

const MenuLink: React.FC<MenuLinkProps> = ({ label, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer rounded-lg mx-1"
        >
            <span className="text-sm text-gray-700 hover:text-gray-900">
                {label}
            </span>
        </div>
    );
};

export default MenuLink;