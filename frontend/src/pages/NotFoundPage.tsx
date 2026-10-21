import { Link } from 'react-router-dom';

import { Button } from '../components/ui/button';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-text flex-col items-center justify-center px-6 text-center">
      <p className="text-eyebrow text-marketing-accent">404 Error</p>
      <h1 className="mt-3 text-display font-bold tracking-tight text-foreground">
        Page not found.
      </h1>
      <p className="mt-4 max-w-md text-body-lg text-muted-foreground">
        The page you requested does not exist or may have moved.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button size="lg" className="rounded-full px-6" asChild>
          <Link to="/">Back home</Link>
        </Button>
        <Button size="lg" variant="outline" className="rounded-full px-6" asChild>
          <Link to="/docs">Documentation</Link>
        </Button>
      </div>
    </div>
  );
}
