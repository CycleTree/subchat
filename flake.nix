{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let 
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
            playwright
            chromium
          ];
          
          shellHook = ''
            export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
            export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
            
            echo "🎭 Playwright environment ready"
            echo "📋 Node: $(node --version)"
            echo "🌐 Playwright: $(npx playwright --version || echo 'not found')"
            echo ""
            echo "Usage:"
            echo "  npm run dev     # Start subchat"
            echo "  npm run test    # Run tests with Playwright"
          '';
        };
      });
}
