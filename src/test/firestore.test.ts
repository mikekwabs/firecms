import { initializeApp } from "firebase/app";
import { Timestamp } from "firebase/firestore";
import { productSchema } from "./test_site_config";
import { computeProperties, initWithProperties } from "../core/utils";
import { useFirestoreDataSource } from "../firebase_app";
import { EntitySchema } from "../models";

const firebaseApp = initializeApp({});
const firestoreDatasource = useFirestoreDataSource({ firebaseApp });

it("timestamp conversion", () => {

    const schema: EntitySchema = {
        id:"test",
        name: "Test entity",
        properties: {
            created_at: {
                dataType: "timestamp",
                title: "Created at"
            }
        }
    };

    const timestamp = Timestamp.now();
    const date = timestamp.toDate();
    expect((firestoreDatasource as any).firestoreToCMSModel({ created_at: timestamp }, schema, "any")
    ).toEqual({ created_at: date });
});

it("timestamp array conversion", () => {

    const schema: EntitySchema = {
        id:"test",
        name: "Test entity",
        properties: {
            my_array: {
                dataType: "array",
                of: {
                    dataType: "timestamp",
                    title: "Created at"
                }
            }
        }
    };

    const timestamp = Timestamp.now();
    const date = timestamp.toDate();

    expect(
        (firestoreDatasource as any).firestoreToCMSModel({ my_array: [{ created_at: timestamp }] }, schema, "any")
    ).toEqual({ myArray: [{ created_at: date }] });

});

it("Initial values", () => {

    const properties = computeProperties({
        propertiesOrBuilder: productSchema.properties,
        path: "test",
        values: productSchema.defaultValues
    });
    const initialisedValues = initWithProperties(properties, productSchema.defaultValues);
    console.log(initialisedValues);
    expect(
        Object.values(initialisedValues).filter((v) => v === undefined)
    ).toHaveLength(0);

});

