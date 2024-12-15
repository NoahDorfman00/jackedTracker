import * as React from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { Alert, View, Text, TextInput, Button, StyleSheet, SafeAreaView, ScrollView, useColorScheme, ImageBackground, Animated, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
// import PickerSelect from 'react-native-picker-select';
// import SearchableDropdown from 'react-native-searchable-dropdown';
import SelectList from './SelectList';
import { Calendar } from 'react-native-calendars'; // Import Calendar
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LineChart } from 'react-native-chart-kit'; // Add this import

const Stack = createNativeStackNavigator();

global.selectedDate;

export default function App() {
  // const [selectedDate, setSelectedDate] = React.useState<string>(); // Set to today's date in YYYY-MM-DD format
  const colorScheme = useColorScheme() || 'dark';
  const styles = getStyles(colorScheme);
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Lifts"
          component={LiftsScreen}
          // initialParams={{
          //   selectedDate: selectedDate,
          //   setSelectedDate: setSelectedDate,
          // }}
          options={({ navigation }) => ({
            headerRight: () => (
              <Button title="Go to Charts" onPress={() => navigation.navigate('Charts')} />
            ),
            headerTransparent: true,
            headerShadowVisible: true,
            headerStyle: {
              backgroundColor: "#121212",
            },
            headerTintColor: styles.text.color,
          })}
        />
        <Stack.Screen
          name="Charts"
          component={ChartsScreen}
          // initialParams={{
          //   selectedDate: selectedDate,
          //   setSelectedDate: setSelectedDate,
          // }}
          options={({ navigation }) => ({
            headerTransparent: true,
            headerShadowVisible: true,
            headerStyle: {
              backgroundColor: "#121212",
            },
            headerTintColor: styles.text.color,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}



// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqaUq38GarTWV3HsJSkuoYuhegM1Sd2J4",
  authDomain: "jackedtracker.firebaseapp.com",
  databaseURL: "https://jackedtracker-default-rtdb.firebaseio.com",
  projectId: "jackedtracker",
  storageBucket: "jackedtracker.firebasestorage.app",
  messagingSenderId: "801417628220",
  appId: "1:801417628220:web:5e1d79d8ec2422d6211139",
  measurementId: "G-Q5C63J4TRW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const getStyles = (colorScheme: 'dark' | 'light') => ({
  container: {
    padding: 16,
    backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
  },
  backgroundImage: {
    flex: 1,
    backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
  },
  row: {
    flexDirection: 'row',
  },
  text: {
    color: colorScheme === 'dark' ? 'white' : 'black',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    // marginBottom: 10,
    margin: 5,
    padding: 8,
    color: colorScheme === 'dark' ? 'white' : 'black',
  },
  dropdownItemContainer: {
    height: 25,
    borderColor: "red",
    color: "transparent",
  },
  dropdownItemText: {
    height: 20,
    margin: 5,
    padding: 8,
    color: colorScheme === 'dark' ? 'white' : 'black',
  },
  movement: {
    width: 200,
  },
  weight: {
    width: 125,
  },
  reps: {
    width: 125,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

const retrieveMovements = async (): Promise<unknown> => {
  try {
    const db = getDatabase();
    const movementsRef = ref(db, 'movements');
    const snapshot = await get(movementsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log('No data available');
      return {};
    }
  } catch (error: any) {
    console.error('Error retrieving movements:', error);
    return {};
  }
};

const retrieveMovement = async (key: string): Promise<unknown> => {
  try {
    const db = getDatabase();
    const movementRef = ref(db, `movements/${key}`);
    const snapshot = await get(movementRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log(`No data available for movement: ${key}`);
      return {};
    }
  } catch (error: any) {
    console.error(`Error retrieving movement: ${key}, error:`, error);
    return {};
  }
};

const getMovementDates = (data: unknown): Set<string> => {
  const dateSet = new Set<string>();
  if (data !== null) {
    Object.entries(data).forEach(([name, date]) => {
      dateSet.add(date.toString());
    });
  }
  return dateSet;
};

const addMovementDate = async (name: any, date: string) => {
  const db = getDatabase();
  let dateSet = new Set<string>();
  const movementData = await retrieveMovement(name);
  if (movementData) {
    dateSet = getMovementDates(movementData);
  }
  dateSet.add(date);
  const movementRef = ref(db, `movements/${name}`);
  await set(movementRef, Array.from(dateSet));
  console.log(`Stored 'movements/${name}': ${Array.from(dateSet)}`);
};

const removeMovementDate = async (name: any, date: string) => {
  const db = getDatabase();
  const movementData = await retrieveMovement(name);
  if (movementData) {
    const dateSet = getMovementDates(movementData);
    dateSet.delete(date);
    const movementRef = ref(db, `movements/${name}`);
    await set(movementRef, Array.from(dateSet));
    console.log(`Removed ${date} from 'movements/${name}': ${Array.from(dateSet)}`);
  }
};

const getMovementHistory = async (name: string, movementData: unknown): Promise<unknown> => {
  if (movementData) {
    const dates = getMovementDates(movementData);
    const lifts = await Promise.all(Array.from(dates).map(async (date) => {
      const lift = await retrieveLift(date);
      if (lift && Object.keys(lift).length > 0) {
        const movementSets = lift.movements.find((movement: any) => movement.name === name)?.sets || [];
        if (movementSets || movementSets.length > 0) {
          return { [date]: movementSets };
        }
      }
      console.log(`No ${name} history for date: ${date}`);
      removeMovementDate(name, date);
    }));
    return lifts;
  } else {
    console.log('No movement history available');
    return {};
  }
};

const getMostRecentLiftMaxWeight = (movementHistory: any): number => {
  let maxWeight = 0;
  let mostRecentLift = null;
  for (const [key, value] of Object.entries(movementHistory)) {
    const lift = Object.keys(value)[0];
    if (mostRecentLift === null || lift > Object.keys(mostRecentLift)[0]) {
      mostRecentLift = value;
    }
  }
  if (mostRecentLift !== null && Object.values(mostRecentLift)[0] !== null) {
    const liftSets = Object.values(mostRecentLift)[0];
    for (const set of liftSets) {
      if (set.weight > maxWeight) {
        maxWeight = set.weight;
      }
    }
  }
  return maxWeight;
};

const fetchMovements = async (setMovementOptions: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>) => {
  const movementOptions: { [key: string]: number } = {};
  const movements = await retrieveMovements();
  if (movements) {
    for (const [key, value] of Object.entries(movements)) {
      const movementHistory = await getMovementHistory(key, value);
      const recWeight = getMostRecentLiftMaxWeight(movementHistory);
      movementOptions[key] = recWeight;
    }
  }
  setMovementOptions(movementOptions);
};

const retrieveLifts = async (): Promise<unknown> => {
  try {
    const db = getDatabase();
    const liftsRef = ref(db, 'lifts');
    const snapshot = await get(liftsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log('No lift data available');
      return {};
    }
  } catch (error: any) {
    console.error(`Error retrieving lifts:`, error);
    return {};
  }
};

const retrieveLift = async (date: string): Promise<unknown> => {
  try {
    const db = getDatabase();
    const liftsRef = ref(db, 'lifts');
    const dateRef = child(liftsRef, date);
    const snapshot = await get(dateRef);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log(`No lift data available for date: ${date}`);
      return {};
    }
  } catch (error: any) {
    console.error(`Error retrieving lift for date: ${date}`, error);
    return {};
  }
};

const ChartsScreen = ({ navigation }) => {
  // const { selectedDate, setSelectedDate } = route.params;
  const colorScheme = useColorScheme() || 'dark';
  const styles = getStyles(colorScheme);

  const [selectedMovement, setSelectedMovement] = React.useState<string | null>(null);
  const [liftData, setLiftData] = React.useState<{ x: string, y: number }[]>([]);
  const [movementOptions, setMovementOptions] = React.useState<{ [key: string]: number }>({});

  const [charts, setCharts] = React.useState<{ movement: string; x: string[]; y: number[] }[]>();

  const addChart = (movement: string, x: string[], y: number[]) => {
    setCharts(charts => (charts ? [...charts, { movement: movement, x: x, y: y }] : [{ movement: movement, x: x, y: y }]));
  };

  const removeChart = (movement: string) => {
    setCharts(charts.filter(chart => chart.movement !== movement));
  };

  const populateCharts = async (date: string) => {
    const liftData = await retrieveLift(date);
    if (liftData) {
      // Populate fields with the fetched data
      if (Array.isArray(liftData.movements)) {
        liftData.movements.forEach(async (movement: any) => {
          const movementData = await fetchMovementChartData(movement.name);
          addChart(movement.name, movementData.x, movementData.y);
        });
      }
    }
  };

  const fetchMovementChartData = async (selectedMovement: string): Promise<{ x: string[], y: number[] }> => {
    if (selectedMovement) {
      const parseLiftData = async (selectedMovement: string): Promise<{ x: string[], y: number[] }> => {
        const movementRef = ref(getDatabase(), `movements/${selectedMovement}`);
        const snapshot = await get(movementRef);
        if (snapshot.exists()) {
          const movement = snapshot.val() as any;
          const dates = Object.values(movement);
          const liftData = await Promise.all(dates.map(async (date: string) => {
            const liftRef = ref(getDatabase(), `lifts/${date}`);
            const liftSnapshot = await get(liftRef);
            if (liftSnapshot.exists()) {
              const lift = liftSnapshot.val() as any;
              const movementData = lift.movements.find((movement: any) => movement.name === selectedMovement);
              if (movementData) {
                const maxWeight = movementData.sets.reduce((max: number, set: any) => Math.max(max, Number(set.weight)), 0);
                return { x: date, y: maxWeight };
              }
            }
            return null;
          }));
          // const filteredData = liftData.filter(Boolean);
          return { x: liftData.map(data => data.x), y: liftData.map(data => data.y) };
        }
        return { x: [], y: [] };
      };

      const { x, y } = await parseLiftData(selectedMovement);
      setLiftData(x.map((date, index) => ({ x: date, y: y[index] })));
      return { x, y };
    }
    return { x: [], y: [] };
  };

  React.useEffect(() => {
    populateCharts(global.selectedDate);
    fetchMovements(setMovementOptions);
  }, []);

  return (
    <ImageBackground
      //source={require('./path/to/your/image.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }}>
          {charts && charts.length > 0 ? (
            charts.map(chart => (
              <View key={chart.movement} style={{ alignItems: 'center', justifyContent: 'center', padding: 16, width: '100%' }}>
                <Text style={[styles.text, { alignItems: 'center', justifyContent: 'center' }]}>{chart.movement}</Text>
                <LineChart
                  data={{
                    labels: chart.x,
                    datasets: [
                      {
                        data: chart.y,
                      },
                    ],
                  }}
                  width={Dimensions.get('window').width - 16}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  yAxisInterval={1}
                  chartConfig={{
                    backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
                    backgroundGradientFrom: colorScheme === 'dark' ? 'black' : 'white',
                    backgroundGradientTo: colorScheme === 'dark' ? 'black' : 'white',
                    decimalPlaces: 2,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: "6",
                      strokeWidth: "2",
                      stroke: colorScheme === 'dark' ? 'white' : 'black',
                    },
                  }}
                  bezier
                  style={{
                    alignItems: 'center',
                    padding: 16,
                  }}
                />
              </View>
            ))
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', padding: 16, width: '100%', height: 220 }}>
              <Text style={[styles.text, { alignItems: 'center', justifyContent: 'center' }]}>No lift data available.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const LiftsScreen = ({ navigation }) => {
  // const { selectedDate, setSelectedDate } = route.params;
  const colorScheme = useColorScheme() || 'dark';
  const styles = getStyles(colorScheme);
  const { control, watch, reset, handleSubmit, getValues, formState: { errors } } = useForm({});

  // { movements: [ { name: '', sets: [ { weight: '35', reps: '6' } ] } ] }
  const onSubmit = async (data) => {
    try {
      const db = getDatabase();
      const date = global.selectedDate;
      const liftsRef = ref(db, 'lifts');
      const dateRef = child(liftsRef, String(date));
      await set(dateRef, data);
      console.log(`Stored 'lifts/${date}': ${JSON.stringify(data)}`);

      for (const movement of data.movements) {
        if (movement.name && date) { // Check if name is defined and not an empty string
          addMovementDate(movement.name, date);
        }
      }
    } catch (error: any) {
      console.error('Error storing data', error);
    }
  };

  const SetArray = ({ movementIndex }) => {
    const { fields: setFields, append: appendSet, remove: removeSet } = useFieldArray({
      control,
      name: `movements.${movementIndex}.sets`,
    });

    return (
      <View>
        {setFields.map((set, setIndex) => (
          <View key={set.id}>
            <View style={styles.row}>
              <View style={{ flex: 4 }}>
                <Controller
                  control={control}
                  rules={{
                    // maxLength: 100,
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder={`Weight: ${getRecommendedWeight(movementIndex)}?`}
                      placeholderTextColor={colorScheme === 'dark' ? 'dimgray' : 'gray'}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      style={[styles.input, styles.weight]}
                      keyboardType='numeric'
                    />
                  )}
                  name={`movements.${movementIndex}.sets.${setIndex}.weight`}
                  defaultValue={""}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Controller
                  control={control}
                  rules={{
                    // maxLength: 100,
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      placeholder="Reps"
                      placeholderTextColor={colorScheme === 'dark' ? 'dimgray' : 'gray'}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      style={[styles.input, styles.reps]}
                      keyboardType='numeric'
                    />
                  )}
                  name={`movements.${movementIndex}.sets.${setIndex}.reps`}
                  defaultValue={""}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button title="X" onPress={() => removeSet(setIndex)} />
              </View>
            </View>
          </View>
        ))}
        <Button title="Add Set" onPress={() => appendSet({ weight: 0, reps: 0 })} />
      </View>
    );
  };

  const scrollViewRef = React.useRef<KeyboardAwareScrollView>(null);

  const getRecommendedWeight = (movementIndex: number) => {
    return movementOptions[watch(`movements.${movementIndex}.name`)];
  };

  const { fields, append, remove } = useFieldArray({
    control,
    name: "movements"
  });

  const [movementOptions, setMovementOptions] = React.useState<{ [key: string]: number }>({});

  const handleDateSelect = async (date: string) => {
    global.selectedDate = date;
    // setSelectedDate(date);
    reset();
    fields.forEach((field, index) => { remove(index); });
    const liftData = await retrieveLift(date);
    if (liftData) {
      // Populate fields with the fetched data
      liftData.movements.forEach((movement: any) => {
        append({ name: movement.name, sets: movement.sets });
      });
    }
  };

  const [calendarVisible, setCalendarVisible] = React.useState(false); // Add this line to define calendarVisible state

  const [markedDates, setMarkedDates] = React.useState<string[]>([]);

  React.useEffect(() => {
    const fetchMarkedDates = async () => {
      const db = getDatabase();
      const liftsRef = ref(db, 'lifts');
      const snapshot = await get(liftsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dates = Object.keys(data);
        setMarkedDates(dates);
      }
    };
    fetchMarkedDates();

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateInCurrentTimezone = `${year}-${month}-${day}`;
    handleDateSelect(dateInCurrentTimezone);

    fetchMovements(setMovementOptions);
  }, []);

  return (
    <ImageBackground
      //source={require('./path/to/your/image.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.row, { width: '100%', justifyContent: 'center', alignItems: 'center' }]}>
          <Button
            title={`${global.selectedDate ? global.selectedDate : 'None'}`}
            onPress={() => setCalendarVisible(!calendarVisible)}
          />
          <Button
            title="Submit"
            onPress={handleSubmit(async (data) => {
              await onSubmit(data);
            })}
          />
        </View>
        {calendarVisible && (
          <Calendar
            initialDate={global.selectedDate}
            onDayPress={(date) => {
              handleDateSelect(date.dateString);
              setCalendarVisible(false);
            }}
            markedDates={{
              ...markedDates.reduce((obj, date) => {
                obj[date] = { marked: true };
                return obj;
              }, {}),
              [global.selectedDate]: { selected: true },
            }}
          />
        )}
        <KeyboardAwareScrollView ref={scrollViewRef}>
          <View>
            {fields.map((field, index) => (
              <View key={field.id}>
                <View style={styles.row}>
                  <View style={{ flex: 8 }}>
                    <Controller
                      control={control}
                      rules={{
                        // required: true,
                      }}
                      render={({ field: { onChange, onBlur, value } }) => {
                        return (
                          <SelectList
                            setSelectedVal={onChange}
                            selectedval={value}
                            data={Object.keys(movementOptions).map((key) => ({ key, value: key }))}
                            boxStyles={{ width: '100%' }}
                            dropdownStyles={{ width: '100%' }}
                            dropdownItemStyles={{ width: '100%' }}
                            dropdownTextStyles={styles.text}
                            inputStyles={styles.text}
                            defaultOption={value}
                          />
                        );
                      }}
                      name={`movements.${index}.name`}
                      defaultValue={""}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button title="X" onPress={() => remove(index)} />
                  </View>
                </View>
                <SetArray movementIndex={index} />
                {/* //targetWeight={movementOptions.find(option => option.key === (field as { id: string; value: string }).value)} /> */}
              </View>
            ))}
          </View>
        </KeyboardAwareScrollView>
        <Button title="Add Movement" onPress={() => {
          append({ name: '', sets: [] });
          scrollViewRef.current?.scrollToEnd();
        }} />
      </SafeAreaView>
    </ImageBackground>
  );
}
