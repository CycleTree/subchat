{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = (pkgs.buildFHSEnv {
          name = "subchat-playwright";

          targetPkgs = pkgs: with pkgs; [
            nodejs_22
            openssl
            systemd
            glibc
            glibc.dev
            glib
            cups.lib
            cups
            nss
            nssTools
            alsa-lib
            dbus
            at-spi2-core
            libdrm
            expat
            xorg.libX11
            xorg.libXcomposite
            xorg.libXdamage
            xorg.libXext
            xorg.libXfixes
            xorg.libXrandr
            xorg.libxcb
            mesa
            libxkbcommon
            pango
            cairo
            nspr
          ];

          profile = ''
            export LD_LIBRARY_PATH=/run/opengl-driver/lib:/run/opengl-driver-32/lib:/lib
            export FONTCONFIG_FILE=/etc/fonts/fonts.conf
            
            echo "🎭 FHS environment ready for Playwright"
            echo "📋 Node: $(node --version)"
            echo "🔧 LD_LIBRARY_PATH: $LD_LIBRARY_PATH"
            echo "📚 FHS-compatible /usr/lib available"
            echo ""
            echo "Usage:"
            echo "  npm run dev                    # Start subchat"
            echo "  node simple_screenshot.js     # Take screenshot"
            echo "  npx playwright install         # Install browsers"
          '';

          unshareUser = false;
          unshareIpc = false;
          unsharePid = false;
          unshareNet = false;
          unshareUts = false;
          unshareCgroup = false;
          dieWithParent = true;
        }).env;
      }
    );
}
