import { Link } from 'react-router-dom';
import { Plane } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Plane className="w-10 h-10 text-primary" />
          </div>
        </div>

        <h1 className="text-5xl font-display font-bold text-foreground mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-2">Page Not Found</p>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:brightness-110 transition-all duration-200"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
