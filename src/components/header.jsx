import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { PenBox } from "lucide-react";

const Header = () => {
    return (
        <>
        <nav className="py-4 flex justify-between items-center">
            <Link>
              <img src="/logo.png" className="h-20" />
            </Link>

           <div className="flex gap-8">
     <Show when="signed-out">
    <SignInButton>
      <Button variant="outline">Login</Button>
    </SignInButton>
    </Show>
    <Show when="signed-in">
    {/* add a condition here */}
    <Button variant="destructive" className="rounded-full">
      <PenBox size={20} className="mr-2" />
      Post a Job
    </Button>
    <Link to="/post-job"></Link>
    <UserButton />
  </Show>
</div>
        </nav>
        </>
    );
};

export default Header;