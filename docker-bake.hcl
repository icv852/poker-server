variable "TAG" {
  default = "latest"
}

group "default" {
  targets = ["app"]
}

target "app" {
  dockerfile = "Dockerfile"
  context = "."
  platforms = ["linux/amd64", "linux/arm64"]
  tags = ["docker.io/victorcheng852/poker-server:${TAG}"]
  output = ["type=registry"]
}