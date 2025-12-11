import { getLocalTimeZone, today } from "@internationalized/date";
import { DatePicker as AriaDatePicker, Dialog as AriaDialog } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Calendar } from "./calendar";

const now = today(getLocalTimeZone());

export const CalendarCardDemo = () => (
    <AriaDatePicker aria-label="Calendar card" defaultValue={now}>
        <AriaDialog className="rounded-2xl bg-primary shadow-xl ring ring-secondary_alt">
            <div className="flex px-6 py-5">
                <Calendar />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-secondary p-4">
                <Button size="md" color="secondary">
                    Cancel
                </Button>
                <Button size="md" color="primary">
                    Apply
                </Button>
            </div>
        </AriaDialog>
    </AriaDatePicker>
);