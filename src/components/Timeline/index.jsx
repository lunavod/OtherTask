/* eslint-disable prettier/prettier */
import React from "react"
import { observer } from "mobx-react"
import styles from "./styles.styl"
import moment from "moment"
import ChevronLeft from "assets/awesome/solid/chevron-left.svg"
import ChevronRight from "assets/awesome/solid/chevron-right.svg"
import DaySelector from "components/DaySelector"
import Event from "./Event"
import { useMst } from "models/RootStore"
const ipc = require("electron").ipcRenderer
import { useScrollEmitter } from "../../tools/hooks"
import ScrollContext from "../Screens/scrollContext"

const Timeline = observer(() => {
  const { events, createEvent, timelineDate, setTimelineDate } = useMst()
  const todayEvents = events.filter(e => e.date === timelineDate)
  const [isDragging, setIsDragging] = React.useState(false)

  const arr = []
  for (let i = 0; i < 24; i++) {
    arr.push(i)
  }
  arr.push(0)

  const hourHeight = 37
  const fontSize = 13
  const minuteHeight = (fontSize + hourHeight) / 60

  const [nowOffset, setNowOffset] = React.useState(fontSize)
  const calcOffset = s => {
    if (!s) s = moment().format("HH:mm")
    let offset = fontSize
    const hours = parseInt(s.split(":")[0])
    offset += hours * (fontSize + hourHeight)
    const minutes = parseInt(s.split(":")[1])
    offset += minutes * minuteHeight
    return offset
  }
  React.useEffect(() => {
    setNowOffset(calcOffset())
    ref.current.scrollTop =
      nowRef.current.offsetTop - ref.current.getBoundingClientRect().height / 2
    const timer = setInterval(() => setNowOffset(calcOffset()), 10000)
    return () => {
      clearInterval(timer)
    }
  }, [])

  React.useEffect(() => {
    const onFocus = () => {
      ref.current.scrollTop =
        nowRef.current.offsetTop -
        ref.current.getBoundingClientRect().height / 2
    }
    onFocus()
    ipc.on("focus", onFocus)
    return () => {
      ipc.off("focus", onFocus)
    }
  }, [])

  const ref = React.useRef(null)
  const nowRef = React.useRef(null)
  const [eventRefs, setEventRefs] = React.useState({})

  const onPrevClick = () => {
    setTimelineDate(
      moment(timelineDate)
        .subtract(1, "days")
        .format("YYYY-MM-DD"),
    )
  }

  const onNextClick = () => {
    setTimelineDate(
      moment(timelineDate)
        .add(1, "days")
        .format("YYYY-MM-DD"),
    )
  }

  const onTimelineClick = e => {
    if (isDragging) return
    const modalsEl = document.querySelector("#modals")
    if (e.target === modalsEl || modalsEl.contains(e.target)) return
    for (const id of Object.keys(eventRefs)) {
      const el = eventRefs[id].current
      if (el && (el === e.target || el.contains(e.target))) return
    }
    const box = ref.current.getBoundingClientRect()
    const hoursTotal =
      (e.pageY - box.top - fontSize + ref.current.scrollTop) /
      (fontSize + hourHeight)
    const hours = Math.floor(hoursTotal < 0 ? 0 : hoursTotal)
    const minutes = Math.floor(hoursTotal < 0 ? 0 : 60 * (hoursTotal % 1))
    const start =
      `${hours}`.padStart(2, "0") +
      ":" +
      `${minutes - (minutes % 5)}`.padStart(2, "0")
    createEvent({
      start,
      duration: 60,
      date: timelineDate,
      name: "Новое событие",
    })
  }
  console.log(isDragging)

  const newRefs = {}
  todayEvents.forEach(e => {
    if (!(e.id in eventRefs)) {
      newRefs[e.id] = React.createRef()
    }
  })
  if (Object.keys(newRefs).length) setEventRefs({ ...eventRefs, ...newRefs })
  console.log(todayEvents.map(e => e.toJSON()))

  const onDragStart = (getInitialData, processMove, prevent = () => false) => {
    return (event, e) => {
      if (prevent(event, e)) return
      e.preventDefault()
      setIsDragging(true)
      const startY = e.pageY
      const initialData = getInitialData(event)
      const box = ref.current.getBoundingClientRect()
      const onMove = moveE => {
        if (moveE.pageY <= box.top + fontSize) return
        const move = moveE.pageY - startY
        const minutes = Math.floor(move / minuteHeight)
        const add = minutes - (minutes % 5)
        processMove(event, add, initialData)
      }
      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", () => {
        document.removeEventListener("mousemove", onMove)
        setTimeout(() => setIsDragging(false), 300)
      })
    }
  }

  const onStretchStart = onDragStart(
    event => event.duration,
    (event, add, initialTime) => {
      event.setDuration(initialTime + add)
    },
  )

  const onMoveStart = onDragStart(
    event => ({ initialStart: event.start, initialDuration: event.duration }),
    (event, add, { initialStart }) => {
      const minimum =
        0 -
        moment
          .duration(
            moment(initialStart, "HH:mm").diff(moment("00:00", "HH:mm")),
          )
          .asMinutes()
      if (add < minimum) add = minimum
      console.log(add)
      let newStart = moment(initialStart, "HH:mm")
        .add(add, "minutes")
        .format("HH:mm")
      event.processSetStart(newStart)
    },
    (event, e) => {
      return e.target.classList.contains(styles.eventStretch)
    },
  )

  const [initialScrolled, setInitialScrolled] = React.useState(false)

  React.useEffect(() => {
    console.log("TOP CHANGED", nowRef.current.offsetTop)
    if (initialScrolled) return
    ref.current.scrollTop =
      nowRef.current.offsetTop - ref.current.getBoundingClientRect().height / 2
    if (nowRef.current.offsetTop > 6) setInitialScrolled(true)
  }, [nowRef.current?.getBoundingClientRect().top])

  const scrollEmitter = useScrollEmitter(ref)

  return (
    <div className={styles.wrapper}>
      <DaySelector />
      <div className={styles.currentDate}>
        <span className={styles.dayName}>
          {timelineDate === moment().format("YYYY-MM-DD") ? "Сегодня" : ""}
        </span>
        <span className={styles.dayDetail}>
          {moment(timelineDate).format("dd, DD MMM")}
        </span>
        <span className={styles.action} onClick={onPrevClick}>
          <ChevronLeft />
        </span>
        <span className={styles.action} onClick={onNextClick}>
          <ChevronRight />
        </span>
      </div>
      <div className={styles.allDayList}>
        {Boolean(todayEvents.filter(t => t.allDay).length) && (
          <div className={styles.allDayName}>Весь день:</div>
        )}
        {todayEvents
          .filter(e => e.allDay)
          .map(event => {
            return (
              <div
                key={`event_${event.id}`}
                className={styles.allDayTask}
                ref={eventRefs[event.id] || { current: null }}
              >
                <Event event={event} boxRef={eventRefs[event.id]} />
              </div>
            )
          })}
      </div>
      <div
        className={styles.timeline}
        ref={ref}
        onDoubleClick={onTimelineClick}
      >
        <ScrollContext.Provider value={scrollEmitter}>
          {todayEvents
            .filter(t => !t.allDay)
            .map(event => (
              <div
                ref={eventRefs[event.id] || { current: null }}
                key={`event_${event.id}`}
                className={styles.eventContainer}
                style={{
                  "--start": `${calcOffset(event.start)}px`,
                  "--end": `${((hourHeight + fontSize) / 60) * event.duration +
                    calcOffset(event.start)}px`,
                }}
                draggable={true}
                onDragStart={e => onMoveStart(event, e)}
              >
                <Event
                  event={event}
                  boxRef={eventRefs[event.id]}
                  isDragging={isDragging}
                />
                <div
                  className={styles.eventStretch}
                  draggable={true}
                  onDragStart={e => onStretchStart(event, e)}
                />
              </div>
            ))}
          <div
            className={styles.now}
            style={{ "--now-offset": `${nowOffset}px` }}
            ref={nowRef}
          >
            <span>{moment().format("HH:mm")}</span>
            <div className={styles.line} />
          </div>
          {arr.map(i => (
            <div
              key={i}
              className={styles.hour}
              style={{
                "--hour-height": `${hourHeight}px`,
                "--font-size": `${fontSize}px`,
              }}
            >
              <span>{`${i}`.padStart(2, "0")}:00</span>
              <div className={styles.dash} />
            </div>
          ))}
        </ScrollContext.Provider>
      </div>
    </div>
  )
})

export default Timeline
