fn main() {
    #[cfg(feature = "renderdoc")]
    println!("cargo:rustc-link-lib=renderdoc");
}
