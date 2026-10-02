import { useLocation, useNavigate } from "react-router-dom";

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = location.pathname.startsWith("/admin");

  const dashboardPath = isAdmin
    ? "/admin"
    : "/dashboard";

  return (
    <button
      type="button"
      onClick={() => navigate(dashboardPath)}
      className="
        inline-flex
        items-center
        gap-2
        rounded-lg
        border
        border-gray-700
        bg-gray-900
        px-5
        py-2.5
        text-sm
        font-semibold
        text-white
        shadow-md
        transition-all
        duration-200
        hover:border-cyan-400
        hover:bg-cyan-400
        hover:text-black
        hover:shadow-cyan-400/20
        active:scale-95
      "
    >
      <span className="text-lg">
        ←
      </span>

      <span>
        Back to Dashboard
      </span>
    </button>
  );
}