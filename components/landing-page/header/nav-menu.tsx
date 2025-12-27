import React from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { menus } from "./../data";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

export default function NavMenu() {
  const [offset, setOffset] = React.useState<number | null>(null);
  const [list, setList] = React.useState<HTMLUListElement | null>();
  const [value, setValue] = React.useState<string | null>();

  const onNodeUpdate = (trigger: any, itemValue: any) => {
    if (trigger && list && value === itemValue) {
      const triggerOffsetLeft = trigger.offsetLeft + trigger.offsetWidth / 6;
      setOffset(Math.round(triggerOffsetLeft));
    } else if (value === "") {
      setOffset(null);
    }
    return trigger;
  };

  return (
    <div>
      <NavigationMenu.Root
        onValueChange={setValue}
        className="relative justify-start group z-[9999]"
      >
        <NavigationMenu.List
          ref={(node) =>
            setList(node instanceof HTMLUListElement ? node : null)
          }
          className="group flex list-none gap-8"
        >
          {menus?.map((item: any, index: number) =>
            item.child ? (
              <NavigationMenu.Item key={`item-${index}`} value={item}>
                <NavigationMenu.Trigger
                  ref={(node) => onNodeUpdate(node, item)}
                  asChild
                  className="flex items-center"
                >
                  <div className="flex items-center py-4 cursor-pointer group data-[state=open]:text-primary">
                    <span className="text-base font-medium text-default-600">
                      {item.title}
                    </span>
                    <ChevronDown
                      className="relative top-[1px] ml-1 h-4 w-4 transition duration-200 group-data-[state=open]:rotate-180"
                      aria-hidden="true"
                    />
                  </div>
                </NavigationMenu.Trigger>

                <NavigationMenu.Content
                  className={cn(
                    "w-full rounded-md border bg-popover text-popover-foreground shadow-lg"
                  )}
                >
                  <div className="min-w-[200px] p-4">
                    {item.child?.map((childItem: any, cIndex: number) => (
                      <ListItem
                        key={`child-${cIndex}`}
                        title={childItem.title}
                        href={childItem.href}
                        childItem={childItem}
                        className="text-base font-medium text-default-600"
                      />
                    ))}
                  </div>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            ) : (
              <NavigationMenu.Item key={`item-${index}`}>
                <NavigationMenu.Link asChild>
                  <Link href={item.href ?? "#"}>
                    <div className="flex items-center px-2 py-4 cursor-pointer group data-[state=open]:text-primary">
                      <span className="text-base font-medium text-default-600 hover:text-primary">
                        {item.title}
                      </span>
                    </div>
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            )
          )}
        </NavigationMenu.List>

        <div className="absolute top-full">
          <NavigationMenu.Viewport
            style={{
              display: !offset ? "none" : undefined,
              transform: `translateX(${offset}px)`,
              top: "100%",
              transition: "all 0.5s ease",
            }}
          />
        </div>
      </NavigationMenu.Root>
    </div>
  );
}

type ListItemProps = {
  title: string;
  href: string;
  className?: string;
  childItem?: any;
};

const ListItem = React.forwardRef<HTMLAnchorElement, ListItemProps>(
  ({ className, title, href, ...props }, forwardedRef) => {
    return (
      <NavigationMenu.Link asChild>
        <Link
          href={href ?? "#"}
          ref={forwardedRef}
          className={cn(
            "select-none text-base font-medium text-default-600 rounded-md flex items-center gap-2 mb-4 last:mb-0 leading-none no-underline outline-none transition-colors hover:text-primary focus:text-primary",
            className
          )}
          {...props}
        >
          <div className="capitalize">{title}</div>
        </Link>
      </NavigationMenu.Link>
    );
  }
);

ListItem.displayName = "ListItem";
