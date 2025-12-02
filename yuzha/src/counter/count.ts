import systemMessageBg from "@shared/asset/SystemMessageBg.png";

export const counterUi = {
  backButton:
    "absolute right-6 top-6 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-blue-500 active:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60",
  newButton:
    "absolute right-6 top-16 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-blue-500 active:bg-blue-600",
  systemMessageContainer:
    "pointer-events-none absolute left-1/2 top-48 flex h-28 w-[800px] -translate-x-1/2 items-center justify-center",
  systemMessageImage: "h-full w-full object-contain",
};

export { systemMessageBg };
