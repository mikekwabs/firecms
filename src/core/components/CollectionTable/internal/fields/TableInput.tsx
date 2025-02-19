import React, { useEffect, useRef, useState } from "react";
import { TextareaAutosize, Theme } from "@mui/material";
import clsx from "clsx";


import createStyles from "@mui/styles/createStyles";
import makeStyles from "@mui/styles/makeStyles";


export const useInputStyles = makeStyles<Theme>(theme => createStyles({
        input: {
            padding: 0,
            margin: 0,
            width: "100%",
            color: "unset",
            fontWeight: "unset",
            lineHeight: "unset",
            fontSize: "unset",
            fontFamily: "unset",
            background: "unset",
            border: "unset",
            resize: "none",
            outline: "none"
        }
    })
);

export function TableInput(props: {
    error: Error | undefined;
    value: string;
    multiline: boolean;
    focused: boolean;
    disabled: boolean;
    updateValue: (newValue: (string | null)) => void;
}) {
    const { disabled, value, multiline, updateValue, focused } = props;
    const [internalValue, setInternalValue] = useState<typeof value>(value);
    const focusedState = useRef<boolean>(false);

    useEffect(
        () => {
            const doUpdate = () => {
                const emptyInitialValue = !value || value.length === 0;
                if (emptyInitialValue && !internalValue)
                    return;
                if (internalValue !== value)
                    updateValue(internalValue);
            };
            const handler = setTimeout(doUpdate, 300);

            return () => {
                clearTimeout(handler);
            };

        },
        [internalValue]
    );

    useEffect(
        () => {
            if (!focused && value !== internalValue)
                setInternalValue(value);
        },
        [value, focused]
    );

    const classes = useInputStyles();

    const ref = React.createRef<HTMLTextAreaElement>();
    useEffect(() => {
        if (ref.current && focused && !focusedState.current) {
            focusedState.current = true;
            ref.current.focus({ preventScroll: true });
            ref.current.selectionStart = ref.current.value.length;
            ref.current.selectionEnd = ref.current.value.length;
        } else {
            focusedState.current = focused;
        }
    }, [focused, ref]);

    return (
        <div style={{ display: "flex" }}>
            <TextareaAutosize
                ref={ref}
                disabled={disabled}
                className={clsx(classes.input)}
                value={internalValue ?? ""}
                onChange={(evt) => {
                    const newValue = evt.target.value as string;
                    if (multiline || !newValue.endsWith("\n"))
                        setInternalValue(newValue);
                }}
            />
        </div>
    );
}
