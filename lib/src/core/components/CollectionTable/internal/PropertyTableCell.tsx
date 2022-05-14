import {
    CMSType,
    Entity,
    EntityReference,
    ResolvedArrayProperty,
    ResolvedNumberProperty,
    ResolvedProperty,
    ResolvedStringProperty
} from "../../../../models";
import React, { useCallback, useEffect, useState } from "react";
import { TableInput } from "./fields/TableInput";
import { TableSelect } from "./fields/TableSelect";
import { NumberTableInput } from "./fields/TableNumberInput";
import { TableSwitch } from "./fields/TableSwitch";
import { TableDateField } from "./fields/TableDateField";
import { ErrorBoundary } from "../../ErrorBoundary";
import { PropertyPreview } from "../../../../preview";
import { CellStyleProps } from "../../Table/styles";
import { TableReferenceField } from "./fields/TableReferenceField";

import { getPreviewSizeFrom } from "../../../../preview/util";
import { useClearRestoreValue } from "../../../../hooks";
import equal from "react-fast-compare"
import { isReadOnly } from "../../../util/entities";
import { TableCell } from "../../Table/TableCell";
import { AnySchema } from "yup";
import { TableStorageUpload } from "./fields/TableStorageUpload";

export interface PropertyTableCellProps<T extends CMSType> {
    name: string;
    selected: boolean;
    value: T;
    onSelect: (cellRect: DOMRect | undefined) => void;
    openPopup: (cellRect: DOMRect | undefined) => void;
    setPreventOutsideClick: (value: boolean) => void;
    focused: boolean;
    setFocused: (value: boolean) => void;
    property: ResolvedProperty<T>;
    height: number;
    width: number;
    entity: Entity<any>;
    path: string;
    validation: AnySchema;
    onValueChange?: (params: OnCellChangeParams<T>) => void
}

/**
 * Props passed in a callback when the content of a cell in a table has been edited
 */
export interface OnCellChangeParams<T> {
    value: T,
    name: string,
    setError: (e: Error) => void,
    setSaved: (saved: boolean) => void
}

function isStorageProperty<T>(property: ResolvedProperty) {
    if (property.dataType === "string" && (property as ResolvedStringProperty).storage)
        return true;
    if (property.dataType === "array") {
        if (Array.isArray(property.of)) {
            return false;
        } else {
            return ((property as ResolvedArrayProperty).of as ResolvedProperty)?.dataType === "string" &&
                ((property as ResolvedArrayProperty).of as ResolvedStringProperty)?.storage
        }
    }
    return false;
}

const PropertyTableCellInternal = <T extends CMSType>({
                                                          selected,
                                                          focused,
                                                          name,
                                                          setPreventOutsideClick,
                                                          setFocused,
                                                          onValueChange,
                                                          onSelect,
                                                          openPopup,
                                                          value,
                                                          property,
                                                          validation,
                                                          size,
                                                          align,
                                                          width,
                                                          height,
                                                          entity,
                                                          path
                                                      }: PropertyTableCellProps<T> & CellStyleProps) => {

    const [internalValue, setInternalValue] = useState<any | null>(value);

    useClearRestoreValue<T>({
        property,
        value: internalValue,
        setValue: setInternalValue
    });

    const [error, setError] = useState<Error | undefined>();
    const [saved, setSaved] = useState<boolean>(false);

    const customField = Boolean(property.Field);
    const customPreview = Boolean(property.Preview);
    const readOnly = isReadOnly(property);
    const disabledTooltip: string | undefined = typeof property.disabled === "object" ? property.disabled.disabledMessage : undefined;
    const disabled = Boolean(property.disabled);

    const onBlur = useCallback(() => {
        setFocused(false);
    }, []);

    useEffect(
        () => {
            if (value !== internalValue) {
                setInternalValue(value);
            }
        },
        [value]
    );

    useEffect(
        () => {
            if (!equal(value, internalValue)) {
                setSaved(false);
                validation
                    .validate(internalValue)
                    .then(() => {
                        setError(undefined);
                        if (onValueChange) {
                            onValueChange({
                                value: internalValue,
                                name,
                                setError,
                                setSaved
                            });
                        }
                    })
                    .catch((e) => {
                        console.error(e);
                        setError(e);
                    });
            }
        },
        [internalValue]
    );

    const updateValue = useCallback(
        (newValue: any | null) => {

            let updatedValue: any;
            if (newValue === undefined) {
                updatedValue = null;
            } else {
                updatedValue = newValue;
            }
            setInternalValue(updatedValue);
        },
        []
    );

    let innerComponent: JSX.Element | undefined;
    let allowScroll = false;
    let showExpandIcon = false;
    let removePadding = false;
    let fullHeight = false;

    if (!readOnly && !customField && (!customPreview || selected)) {
        const isAStorageProperty = isStorageProperty(property);
        if (isAStorageProperty) {
            innerComponent = <TableStorageUpload error={error}
                                                 disabled={disabled}
                                                 focused={focused}
                                                 property={property as ResolvedStringProperty | ResolvedArrayProperty<string[]>}
                                                 entity={entity}
                                                 path={path}
                                                 value={internalValue}
                                                 previewSize={getPreviewSizeFrom(size)}
                                                 updateValue={updateValue}
                                                 propertyKey={name as string}
                                                 onBlur={onBlur}
                                                 setPreventOutsideClick={setPreventOutsideClick}
            />;
            showExpandIcon = true;
            fullHeight = true;
            removePadding = true;
        } else if (selected && property.dataType === "number") {
            const numberProperty = property as ResolvedNumberProperty;
            if (numberProperty.enumValues) {
                innerComponent = <TableSelect name={name as string}
                                              multiple={false}
                                              disabled={disabled}
                                              focused={focused}
                                              valueType={"number"}
                                              small={getPreviewSizeFrom(size) !== "regular"}
                                              enumValues={numberProperty.enumValues}
                                              error={error}
                                              onBlur={onBlur}
                                              internalValue={internalValue as string | number}
                                              updateValue={updateValue}
                                              setPreventOutsideClick={setPreventOutsideClick}
                />;
                fullHeight = true;
            } else {
                innerComponent = <NumberTableInput
                    align={align}
                    error={error}
                    focused={focused}
                    disabled={disabled}
                    onBlur={onBlur}
                    value={internalValue as number}
                    updateValue={updateValue}
                />;
                allowScroll = true;
            }
        } else if (selected && property.dataType === "string") {
            const stringProperty = property as ResolvedStringProperty;
            if (stringProperty.enumValues) {
                innerComponent = <TableSelect name={name as string}
                                              multiple={false}
                                              focused={focused}
                                              disabled={disabled}
                                              valueType={"string"}
                                              small={getPreviewSizeFrom(size) !== "regular"}
                                              enumValues={stringProperty.enumValues}
                                              error={error}
                                              onBlur={onBlur}
                                              internalValue={internalValue as string | number}
                                              updateValue={updateValue}
                                              setPreventOutsideClick={setPreventOutsideClick}
                />;
                fullHeight = true;
            } else if (!stringProperty.storage && !stringProperty.markdown) {
                const multiline = !!stringProperty.multiline;
                innerComponent = <TableInput error={error}
                                             disabled={disabled}
                                             multiline={multiline}
                                             focused={focused}
                                             value={internalValue as string}
                                             updateValue={updateValue}
                />;
                allowScroll = true;
            }
        } else if (property.dataType === "boolean") {
            innerComponent = <TableSwitch error={error}
                                          disabled={disabled}
                                          focused={focused}
                                          internalValue={internalValue as boolean}
                                          updateValue={updateValue}
            />;
        } else if (property.dataType === "date") {
            innerComponent = <TableDateField name={name as string}
                                             error={error}
                                             disabled={disabled}
                                             mode={property.mode}
                                             focused={focused}
                                             internalValue={internalValue as Date}
                                             updateValue={updateValue}
                                             setPreventOutsideClick={setPreventOutsideClick}
            />;
            allowScroll = true;
        } else if (property.dataType === "reference") {
            if (typeof property.path === "string") {
                innerComponent = <TableReferenceField name={name as string}
                                                      internalValue={internalValue as EntityReference}
                                                      updateValue={updateValue}
                                                      disabled={disabled}
                                                      size={size}
                                                      path={property.path}
                                                      multiselect={false}
                                                      previewProperties={property.previewProperties}
                                                      title={property.name}
                                                      setPreventOutsideClick={setPreventOutsideClick}
                />;
            }
            allowScroll = false;
        } else if (property.dataType === "array") {
            const arrayProperty = (property as ResolvedArrayProperty);

            if (!arrayProperty.of && !arrayProperty.oneOf) {
                throw Error(`You need to specify an 'of' or 'oneOf' prop (or specify a custom field) in your array property ${name}`);
            }
            if (arrayProperty.of && !Array.isArray(arrayProperty.of)) {
                if (arrayProperty.of.dataType === "string" || arrayProperty.of.dataType === "number") {
                    if (selected && arrayProperty.of.enumValues) {
                        innerComponent = <TableSelect name={name as string}
                                                      multiple={true}
                                                      disabled={disabled}
                                                      focused={focused}
                                                      small={getPreviewSizeFrom(size) !== "regular"}
                                                      valueType={arrayProperty.of.dataType}
                                                      enumValues={arrayProperty.of.enumValues}
                                                      error={error}
                                                      onBlur={onBlur}
                                                      internalValue={internalValue as string | number}
                                                      updateValue={updateValue}
                                                      setPreventOutsideClick={setPreventOutsideClick}
                        />;
                        allowScroll = true;
                        fullHeight = true;
                    }
                } else if (arrayProperty.of.dataType === "reference") {
                    if (typeof arrayProperty.of.path === "string") {
                        innerComponent =
                            <TableReferenceField name={name as string}
                                                 disabled={disabled}
                                                 internalValue={internalValue as EntityReference[]}
                                                 updateValue={updateValue}
                                                 size={size}
                                                 multiselect={true}
                                                 path={arrayProperty.of.path}
                                                 previewProperties={arrayProperty.of.previewProperties}
                                                 title={arrayProperty.of.name}
                                                 setPreventOutsideClick={setPreventOutsideClick}
                            />;
                    }
                    allowScroll = false;
                }
            }

        }
    }

    if (!innerComponent) {
        allowScroll = false;
        showExpandIcon = selected && !innerComponent && !disabled && !readOnly;
        innerComponent = (
            <PropertyPreview
                width={width}
                height={height}
                entity={entity}
                propertyKey={name as string}
                value={internalValue}
                property={property}
                size={getPreviewSizeFrom(size)}
            />
        );
    }

    return (
        <ErrorBoundary>
            <TableCell
                onSelect={onSelect}
                selected={selected}
                focused={focused}
                disabled={disabled || readOnly}
                disabledTooltip={disabledTooltip ?? "Disabled"}
                removePadding={removePadding}
                fullHeight={fullHeight}
                size={size}
                saved={saved}
                error={error}
                align={align}
                allowScroll={allowScroll}
                showExpandIcon={showExpandIcon}
                openPopup={!disabled ? openPopup : undefined}
                value={internalValue}
            >

                {innerComponent}

            </TableCell>
        </ErrorBoundary>
    );

};

export const PropertyTableCell = React.memo<PropertyTableCellProps<any> & CellStyleProps>(PropertyTableCellInternal, areEqual) as React.FunctionComponent<PropertyTableCellProps<any> & CellStyleProps>;

function areEqual(prevProps: PropertyTableCellProps<any> & CellStyleProps, nextProps: PropertyTableCellProps<any> & CellStyleProps) {
    return prevProps.selected === nextProps.selected &&
        prevProps.focused === nextProps.focused &&
        prevProps.height === nextProps.height &&
        prevProps.size === nextProps.size &&
        prevProps.align === nextProps.align &&
        prevProps.width === nextProps.width &&
        equal(prevProps.property, nextProps.property) &&
        equal(prevProps.value, nextProps.value)
        ;
}
