import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { ScheduleProvider } from "./ScheduleContext.tsx";
import { ScheduleTables } from "./ScheduleTables.tsx";
import ScheduleDndProvider from "./ScheduleDndProvider.tsx";

function App() {

  return (
    <ChakraProvider>
      <ScheduleProvider>
        <ScheduleDndProvider>
          {({ activeTableId }) => (
            <ScheduleTables activeTableId={activeTableId} />
          )}
        </ScheduleDndProvider>
      </ScheduleProvider>
    </ChakraProvider>
  );
}


export default App;
