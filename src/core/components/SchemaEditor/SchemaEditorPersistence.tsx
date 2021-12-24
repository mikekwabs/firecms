import * as React from 'react';
import { SchemaEditor } from "./SchemaEditor";
import { CircularProgressCenter } from "../CircularProgressCenter";
import { EntitySchema, ErrorView, useNavigation } from '../../..';
import { useConfigurationPersistence } from "../../../hooks/useConfigurationPersistence";
import { findSchema } from "../../utils";
import Box from '@mui/material/Box';
import { removeFunctions } from "../../util/objects";

export type SchemaEditorProps = {
    schemaId: string;
};


export function SchemaEditorPersistence({
                                            schemaId,
                                        }: SchemaEditorProps) {

    const navigationContext = useNavigation();
    const configurationPersistence = useConfigurationPersistence();
    if (!configurationPersistence)
        throw Error("Can't use the schema editor without specifying a `ConfigurationPersistence`");

    const [schema, setSchema] = React.useState<EntitySchema | undefined>();
    const [error, setError] = React.useState<Error>();

    React.useEffect(() => {
        try {
            setSchema(findSchema(schemaId, navigationContext.schemas));
        } catch (e) {
            setError(error);
        }
    }, [schemaId, navigationContext.schemas]);

    if (error) {
        return <ErrorView error={`Error fetching schema ${schemaId}`}/>;
    }

    if (!schema) {
        return <CircularProgressCenter/>;
    }

    return <>
        <Box sx={{ p: 2 }}>
            <SchemaEditor schema={schema}
                          onSchemaModified={(schema) => {
                              setSchema(schema);
                              const newSchema = {
                                  ...schema,
                                  properties: removeFunctions(schema.properties),
                              };
                              delete newSchema.views;
                              configurationPersistence.saveSchema(newSchema);
                          }}/>
        </Box>

    </>;

}