import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-black text-primary">
            Ikigai
          </h1>
          <p className="mt-2 text-muted-foreground">
            Join thousands of youth discovering their purpose
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
