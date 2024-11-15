"use client";

import { cn, toPusherKey } from "@/lib/utils";
import Image from "next/image";
import { format } from "date-fns";
import { FC, useEffect, useRef, useState } from "react";
import { pusherClient } from "@/lib/pusher";
import { Message } from "@/lib/validations/message";

interface MessagesProps {
  sessionId: string;
  initialMessages: Message[];
  sessionImg: string | null | undefined;
  chatPartner: User;
  chatId: string;
}

const Messages: FC<MessagesProps> = ({
  sessionId,
  initialMessages,
  sessionImg,
  chatPartner,
  chatId,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`chat:${chatId}`));

    const messageHandler = (message: Message) => {
      setMessages((prev) => [message, ...prev]);
    };

    pusherClient.bind("incoming_message", messageHandler);

    return () => {
      pusherClient.unsubscribe(toPusherKey(`chat:${chatId}:incoming_message`));
      pusherClient.unbind("incoming_message", messageHandler);
    };
  }, [chatId]);

  const scrollDownRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (timestamp: number) => {
    return format(timestamp, "HH:mm");
  };
  return (
    <div
      id="messages"
      className="flex h-full flex-1 flex-col-reverse gap-1 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-w-2 scrolling-touch"
    >
      <div ref={scrollDownRef} />
      {messages.map((message, index) => {
        const isCurrentUser = message.senderId === sessionId;
        const hasNextMessageFromSameUser =
          messages[index - 1]?.senderId === messages[index].senderId;

        const currentMessageDate = format(message.timestamp, "dd/MM/yyyy");
        const previousMessageDate =
          index < messages.length - 1
            ? format(messages[index + 1].timestamp, "dd/MM/yyyy")
            : null;

        const showDateSeparator = currentMessageDate !== previousMessageDate;

        return (
          <div key={`${message.id}-${message.timestamp}`}>
            {showDateSeparator && (
              <div className="flex items-center my-4">
                <hr className="flex-grow border-gray-300 dark:border-gray-600" />
                <span className="mx-4 text-gray-400 dark:text-gray-500">
                  {format(message.timestamp, "EEEE, MMMM d, yyyy")}
                </span>
                <hr className="flex-grow border-gray-300 dark:border-gray-600" />
              </div>
            )}
            <div className="chat-message">
              <div
                className={cn("flex items-end", {
                  "justify-end": isCurrentUser,
                })}
              >
                <div
                  className={cn(
                    "flex flex-col space-y-2 text-base max-w-xs mx-2",
                    {
                      "order-1 items-end": isCurrentUser,
                      "order-2 items-start": !isCurrentUser,
                    }
                  )}
                >
                  <span
                    className={cn("px-4 py-2 rounded-lg inline-block", {
                      "bg-orange-600 text-white": isCurrentUser,
                      "bg-gray-200 text-gray-900": !isCurrentUser,
                      "rounded-br-none":
                        !hasNextMessageFromSameUser && isCurrentUser,
                      "rounded-bl-none":
                        !hasNextMessageFromSameUser && !isCurrentUser,
                    })}
                  >
                    {message.text}{" "}
                    <span
                      className={cn("ml-2 text-xs", {
                        "text-gray-200": isCurrentUser,
                        "text-gray-400 dark:text-gray-500": !isCurrentUser,
                      })}
                    >
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </span>
                </div>

                <div
                  className={cn("relative w-6 h-6", {
                    "order-2": isCurrentUser,
                    "order-1": !isCurrentUser,
                    invisible: hasNextMessageFromSameUser,
                  })}
                >
                  <Image
                    fill
                    src={
                      isCurrentUser ? (sessionImg as string) : chatPartner.image
                    }
                    alt="Profile picture"
                    referrerPolicy="no-referrer"
                    className="rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Messages;
