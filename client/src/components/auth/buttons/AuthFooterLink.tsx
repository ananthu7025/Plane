import { Link } from "react-router-dom";

interface AuthFooterLinkProps {
  text: string;
  linkText: string;
  href: string;
}

export function AuthFooterLink({
  linkText,
  href,
}: AuthFooterLinkProps) {
  return (
    <div className="text-center pt-4 border-t border-gray-200">
      <Link
        to={href}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        ← {linkText}
      </Link>
    </div>
  );
}
