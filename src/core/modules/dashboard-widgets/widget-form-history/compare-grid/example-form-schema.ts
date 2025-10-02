// Schema for the example form, using JSON Schema structure
// This can be extended for your real forms

export const exampleFormSchema = {
  type: "object",
  required: ["age"],
  properties: {
    formAuthors: { type: "string", title: "Form Authors", default: "UserX" },
    name: { type: "string", title: "Name", default: "John" },
    fullName: { type: "string", title: "Full Name", default: "John Doe" },
    age: { type: "integer", title: "Age", default: 30 },
    gender: {
      type: "string",
      title: "Gender",
      enum: ["Male", "Female", "Undisclosed"],
      default: "Male",
    },
    heigh: { type: "number", title: "Heigh", default: 180 },
    address: {
      type: "object",
      title: "Address Shipping",
      properties: {
        street: { type: "string", title: "Street", default: "Main St" },
        streetnumber: {
          type: "string",
          title: "Street Number",
          default: "123",
        },
        postalCode: { type: "string", title: "Postal Code", default: "12345" },
        city: { type: "string", title: "City", default: "Bucharest" },
      },
    },
  },
};
