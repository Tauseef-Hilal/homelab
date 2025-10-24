import BackButton from "@client/components/BackButton";
import GroupChat from "@client/features/chat/components/GroupChat";
import { cx } from "class-variance-authority";

export default function DrivePage() {
  return (
    <>
      <header
        className={cx(
          "w-full text-xl font-bold p-2 border-b-1 fixed top-0 left-0 bg-white flex items-center gap-2"
        )}
      >
        <BackButton />
        <h1 className="">
          <span className="text-neutral-800">#</span> Group-Chat
        </h1>
      </header>
      <main className="h-screen w-full">
        <GroupChat />
      </main>
    </>
  );
}
