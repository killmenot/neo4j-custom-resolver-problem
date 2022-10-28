import { Context } from "@neo4j/graphql/dist/types"
import { GraphQLResolveInfo } from "graphql"
import { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { OGM } from "@neo4j/graphql-ogm";
import { ApolloServer, gql } from "apollo-server";
import neo4j from "neo4j-driver";

const typeDefs = gql`
    type Movie {
        title: String
        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
    }

    type Actor {
        name: String
        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
    }

    type Mutation {
        hello(direction: SortDirection): Boolean!
    }
`;

const driver: Driver = neo4j.driver(
    "bolt://localhost:7687",
    neo4j.auth.basic("neo4j", "killmenot")
);

const ogm = new OGM({ typeDefs, driver });

const resolvers = {
    Mutation: {
        hello: async (parent: any, args: any, context: Context, info: GraphQLResolveInfo) => {
            return true
        },
    },
}

const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    resolvers,
});

Promise.all([
    neoSchema.getSchema(),
    ogm.init()
]).then(([schema]) => {
    const server = new ApolloServer({
        schema,
        context: async ({ req }) => {
            return {
                req,
                driver,
            }
        },
    });

    server.listen().then(({ url }) => {
        console.log(`Server ready at ${url}`);
    });
});
