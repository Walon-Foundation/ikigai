import { SignIn } from "@clerk/nextjs";

export default function AdminSignInPage() {
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-black text-primary">
            Ikigai Admin
          </h1>
          <p className="mt-2 text-muted-foreground">
            Administrator access only
          </p>
        </div>
        <SignIn fallbackRedirectUrl="/admin/dashboard" />
      </div>
    </div>
  );
}
