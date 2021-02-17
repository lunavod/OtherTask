import React from "react"
import { observer } from "mobx-react"
import { useMst } from "models/RootStore"
import styles from "./styles.styl"
import PlusIcon from "../../../assets/plus.svg"
import TagIcon from "assets/awesome/solid/tag.svg"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"

const TaskTags = observer(() => {
  const { tags, createTag, selectedTagType } = useMst()

  const type = selectedTagType

  let list = [...tags.filter(t => t.type === type)]
  list.sort((a, b) => a.index - b.index)

  let onDragEnd = ({ destination, source, draggableId }) => {
    if (!destination) return
    console.log(destination, source, draggableId)

    const id = draggableId

    const arr = [...list]

    arr.forEach(tag => {
      if (tag.id === id) return tag.setIndex(destination.index)

      if (
        source.index < destination.index &&
        tag.index > source.index &&
        tag.index <= destination.index
      ) {
        tag.setIndex(tag.index - 1)
      }

      if (
        source.index > destination.index &&
        tag.index >= destination.index &&
        tag.index < source.index
      ) {
        tag.setIndex(tag.index + 1)
      }
    })
  }

  const Tag = observer(({ tag, provided }) => {
    return (
      <div
        className={styles.tag}
        key={tag.id}
        ref={provided.innerRef}
        id={tag.id}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <TagIcon
          className={styles.colorIndicator}
          style={{ "--tag-color": tag.color }}
        />
        <input
          value={tag.name}
          onChange={e => tag.setName(e.target.value)}
          className={styles.tagName}
        />
        <input
          type={"color"}
          className={styles.colorInput}
          onChange={e => tag.setColor(e.target.value)}
          defaultValue={tag.color}
        />
      </div>
    )
  })

  const Content = observer(({ provided }) => (
    <div className={styles.list} ref={provided.innerRef}>
      {list.map((tag, i) => (
        <Draggable draggableId={tag.id} type={"TAG"} index={i} key={tag.id}>
          {provided => <Tag tag={tag} provided={provided} />}
        </Draggable>
      ))}
      {provided.placeholder}
    </div>
  ))

  return (
    <div className={styles.screen}>
      <div className={styles.info}>
        <span className={styles.title}>
          {type === "TASK" ? "Метки задач" : "Метки событий"}
        </span>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={"tagsList"} type={"TAG"}>
          {provided => <Content provided={provided} />}
        </Droppable>
      </DragDropContext>
      <div
        className={styles.addTag}
        onClick={() => createTag("Новый тэг", type)}
      >
        <PlusIcon />
        Добавить метку
      </div>
    </div>
  )
})

export default TaskTags