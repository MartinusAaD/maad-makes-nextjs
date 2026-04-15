import Link from "next/link";
import Image from "next/image";
import ResponsiveWidthWrapper from "@/components/ResponsiveWidthWrapper/ResponsiveWidthWrapper";
import { MdMailOutline } from "react-icons/md";
import { FaLinkedin } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-primary mt-auto">
      <ResponsiveWidthWrapper>
        <div className="py-12">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Brand Section */}
            <div className="max-w-2xl space-y-3">
              <h3 className="text-2xl md:text-3xl font-bold text-light">
                MAaD Makes
              </h3>
              <p className="text-light text-base leading-relaxed">
                Hi! My name is Martinus, I'm from Norway and the one behind MAaD
                Makes. I made this site for showcasing products I sell, and a
                place for me to display my frontend portfolio.
              </p>
            </div>

            {/* Picutre of Yours Truly */}
            <div className="w-full flex justify-center items-center">
              <Image
                src="/images/martinus-headshot.jpg"
                alt="Image of Martinus"
                width={160}
                height={160}
                className="rounded-full w-full max-w-40"
              />
            </div>

            {/* Socials */}
            <div className="flex gap-4">
              {/* Email */}
              <div className="flex items-center justify-center gap-4 ">
                <a
                  href="mailto:maad.makes@gmail.com"
                  rel="noopener noreferrer"
                  aria-label="MailTo"
                  title="Contact me directly through email!"
                >
                  <MdMailOutline
                    size={48}
                    className="text-light hover:text-gray-300 "
                  />
                </a>
              </div>

              {/* Linkedin */}
              <div className="flex items-center justify-center gap-4 ">
                <a
                  href="https://www.linkedin.com/in/martinus-aamot-dahl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Profile"
                  title="A link to my LinkedIn Profile."
                >
                  <FaLinkedin
                    size={48}
                    className="text-light hover:text-gray-300 "
                  />
                </a>
              </div>

              {/* Github */}
              <div className="flex items-center justify-center gap-4 ">
                <a
                  href="https://github.com/MartinusAaD"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Github Profile"
                  title="A link to my Github Profile."
                >
                  <FaGithub
                    size={48}
                    className="text-light hover:text-gray-300 "
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-light mt-8 pt-8 space-y-2">
            <p className="text-light text-sm text-center">
              © {new Date().getFullYear()} MAaD Makes — All rights reserved.
              Martinus Aamot Dahl
            </p>
            <p className="text-light text-xs text-center italic">
              Product designs remain the property of their respective creators.
            </p>
          </div>
        </div>
      </ResponsiveWidthWrapper>
    </footer>
  );
};

export default Footer;
