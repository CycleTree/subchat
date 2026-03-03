{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_22
          ];
          
          shellHook = ''
            export NIX_LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [
              pkgs.glib
              pkgs.nss
              pkgs.nspr
              pkgs.atk
              pkgs.at-spi2-atk
              pkgs.libxkbcommon
              pkgs.libdrm
              pkgs.xorg.libXcomposite
              pkgs.xorg.libXdamage
              pkgs.xorg.libXrandr
              pkgs.mesa
              pkgs.gtk3
              pkgs.pango
              pkgs.cairo
              pkgs.gdk-pixbuf
              pkgs.fontconfig
              pkgs.freetype
              pkgs.dbus
              pkgs.libGL
              pkgs.libxshmfence
              pkgs.libuuid
              pkgs.expat
            ]}
            export NIX_LD=$(cat ${pkgs.stdenv.cc}/nix-support/dynamic-linker)
            
            echo "🎭 NixOS environment ready with library paths"
            echo "📋 Node: $(node --version)"
            echo "🔧 NIX_LD: $NIX_LD"
            echo "📚 Library paths configured"
            echo ""
            echo "Usage:"
            echo "  npm run dev     # Start subchat"
            echo "  node simple_screenshot.js  # Take screenshot with nix-ld"
          '';
        };
      });
}
