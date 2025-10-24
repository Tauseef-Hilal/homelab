import Link from "next/link";

interface HomeLinkProps {
  link: string;
  icon: React.ReactNode;
  text: string;
}

const HomeLink: React.FC<HomeLinkProps> = ({ link, icon, text }) => {
  return (
    <div className="flex gap-2 items-center p-2 text-xl">
      {icon}
      <Link href={link} className="hover:underline">
        {text}
      </Link>
    </div>
  );
};

export default HomeLink;
