"use client";

import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export function HeaderMenu() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <MenuIcon />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLinkItem
            href="https://paulpowell.cc/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Paul&apos;s Bible Tools
          </DropdownMenuLinkItem>
          <DropdownMenuItem onClick={() => setAboutOpen(true)}>About</DropdownMenuItem>
          <DropdownMenuLinkItem href="mailto:paul.powell@gmail.com">
            Contact Me
          </DropdownMenuLinkItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent
          initialFocus={false}
          className="flex max-h-[85vh] flex-col overflow-y-auto sm:max-w-md"
        >
          <DialogTitle>About</DialogTitle>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              This Bible Contextual Study Guide is one of the tools offered by{" "}
              <a
                href="https://paulpowell.cc/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-primary"
              >
                Paul&apos;s Bible Tools
              </a>
              .
            </p>
            <p>
              Here&apos;s the basic idea behind how it works: you enter a Bible verse (or a
              small range of verses) and, if you like, a study question you&apos;re curious
              about. The app looks up the exact wording of that passage from the ESV Bible.
            </p>
            <p>
              It then asks Claude, an AI assistant made by Anthropic, to suggest other Bible
              verses that connect to your passage — ones that echo the same idea, help explain
              it, or show it fulfilled elsewhere in Scripture. Claude doesn&apos;t make up the
              verse text itself; it only points to which verses are relevant, and the app looks
              up each one&apos;s real wording from the ESV Bible too.
            </p>
            <p>
              Finally, Claude writes a full study guide woven around your passage and those
              cross-references — covering context, themes, and questions for reflection or
              discussion — optionally shaped around the study question you asked. Think of
              Claude as a well-read study partner: it doesn&apos;t know your exact passage
              choice in advance, but it&apos;s very good at reading Scripture closely and
              helping you think it through.
            </p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button />}>Got it</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
