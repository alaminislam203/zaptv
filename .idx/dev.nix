{ pkgs, ... }:

{
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages.
  packages = [
    pkgs.nodejs_20
  ];

  # Sets environment variables in the workspace.
  env = {};

  # Two examples of GenAI features that can be configured per-language
  # and per-project. You can also remove these if you don't want to use them.
  # To learn more, visit https://developers.google.com/idx/guides/customization#generative-ai

  # To learn more, visit https://developers.google.com/idx/guides/customization#available-options
}
