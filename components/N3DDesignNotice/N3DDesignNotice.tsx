import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const N3DDesignNotice = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="w-full bg-bg-light border-l-4 border-primary-lighter p-4 rounded-lg shadow-sm">
        <div className="flex items-start gap-3">
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="text-primary mt-0.5 flex-shrink-0"
          />
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <strong className="text-primary">
                100+ Character Designs Available!
              </strong>{" "}
              Browse the full N3D Melbourne catalog{" "}
              <a
                href="https://www.n3dmelbourne.com/dashboard/designs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-lighter hover:text-primary-darker underline font-medium"
              >
                here
              </a>{" "}
              and{" "}
              <Link
                href="/contact"
                className="text-primary-lighter hover:text-primary-darker underline font-medium"
              >
                request a custom print
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }
};

export default N3DDesignNotice;
