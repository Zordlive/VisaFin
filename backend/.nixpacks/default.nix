# Custom Nix configuration for Coolify deployment
# This overrides Nixpacks auto-generation to fix postgresql_16.dev error
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    python39
    gcc
    postgresql      # PostgreSQL client
    libpq           # Required for psycopg2
  ];

  shellHook = ''
    echo "💻 Django environment ready!"
  '';
}
