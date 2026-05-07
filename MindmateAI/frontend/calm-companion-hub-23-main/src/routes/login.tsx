import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";
import { Brain } from "lucide-react";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignUp ? "Start your wellness journey" : "Continue your wellness journey"}
          </p>
        </div>

        <div className="flex justify-center">
          {isSignUp ? (
            <SignUp
              routing="hash"
              signInUrl="/login"
              afterSignUpUrl="/chat"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border rounded-2xl bg-card",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "rounded-xl",
                  formFieldInput: "rounded-xl",
                  formButtonPrimary: "rounded-xl bg-primary hover:bg-primary/90",
                  footerAction: "hidden",
                },
              }}
            />
          ) : (
            <SignIn
              routing="hash"
              signUpUrl="/login"
              afterSignInUrl="/chat"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border rounded-2xl bg-card",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "rounded-xl",
                  formFieldInput: "rounded-xl",
                  formButtonPrimary: "rounded-xl bg-primary hover:bg-primary/90",
                  footerAction: "hidden",
                },
              }}
            />
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="font-medium text-primary hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
