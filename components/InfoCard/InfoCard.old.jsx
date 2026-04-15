import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const InfoCard = () => {
  return (
    <Link
      href="/character-designs"
      className="group relative bg-gradient-to-br from-primary to-primary-darker rounded-lg shadow-[0_5px_10px_rgba(16,24,40,0.4)] overflow-hidden hover:shadow-[0_12px_24px_rgba(16,24,40,0.5)] transition-all duration-300 hover:-translate-y-1 flex flex-col opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]"
    >
      {/* Badge */}
      <div className="absolute top-3 right-3 bg-yellow text-dark text-xs font-bold px-3 py-1 rounded-full z-10">
        INFO
      </div>

      {/* Icon Section */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-primary-lighter/20 to-transparent">
        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="text-white text-5xl group-hover:scale-110 transition-transform duration-300"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 bg-white">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          100+ More Character Designs
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Browse the full N3D Melbourne catalog or join our waitlist for
          upcoming designs
        </p>
        <div className="flex items-center text-primary-lighter font-semibold text-sm group-hover:text-primary transition-colors">
          Learn More
          <svg
            className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default InfoCard;
