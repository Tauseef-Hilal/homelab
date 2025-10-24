import BackButton from "@client/components/BackButton";
import Explorer from "@client/features/storage/components/Explorer";
import { cx } from "class-variance-authority";

export default function DrivePage() {
  return (
    <>
      <header
        className={cx(
          "fixed top-0 left-0 w-full text-xl font-bold p-2 border-b-1 bg-white flex items-center gap-2"
        )}
      >
        <BackButton />
        <h1 className="">
          <span className="text-neutral-800">#</span> Drive
        </h1>
      </header>
      <main>
        <Explorer />
      </main>
    </>
  );
}
