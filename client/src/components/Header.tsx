import { useLocation } from "wouter";

export function Header() {
  const [location, setLocation] = useLocation();

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="w-[90%] mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => setLocation("/")}>
            <h1 className="text-2xl md:text-3xl font-bold">DMS Care Training Center</h1>
     
          </div>
        </div>
      </div>
    </header>
  );
}
