"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@client/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@client/components/ui/tabs";

import { UserShareTab } from "./UserShareTab";
import { LinkShareTab } from "./LinkShareTab";
import { File, Folder } from "../types/storage.types";

interface ShareProps {
  item: File | Folder;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ShareDialog: React.FC<ShareProps> = ({ item, open, setOpen }) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="truncate">Share</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="people" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="outline-none focus:ring-0">
            <UserShareTab itemId={item.id} />
          </TabsContent>

          <TabsContent value="links" className="outline-none focus:ring-0">
            <LinkShareTab itemId={item.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
